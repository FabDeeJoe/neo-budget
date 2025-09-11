-- Create function to process monthly recurring expenses
CREATE OR REPLACE FUNCTION process_monthly_recurring_expenses(
  target_user_id UUID,
  target_month TEXT
) RETURNS JSON AS $$
DECLARE
  result JSON;
  processed_count INT := 0;
  total_count INT := 0;
  expense_record RECORD;
  expense_date DATE;
  month_year DATE;
  days_in_month INT;
BEGIN
  -- Validate month format (YYYY-MM)
  IF NOT target_month ~ '^\d{4}-\d{2}$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid month format. Expected YYYY-MM',
      'processed_count', 0,
      'total_count', 0
    );
  END IF;

  -- Parse month and calculate days in month
  month_year := (target_month || '-01')::DATE;
  days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', month_year) + INTERVAL '1 month' - INTERVAL '1 day'));

  -- Get all active recurring expenses for the user
  FOR expense_record IN 
    SELECT * FROM recurring_expenses 
    WHERE user_id = target_user_id 
    AND is_active = true
  LOOP
    total_count := total_count + 1;
    
    -- Check if this recurring expense has already been processed for this month
    IF EXISTS (
      SELECT 1 FROM expenses 
      WHERE user_id = target_user_id 
      AND recurring_expense_id = expense_record.id
      AND date >= (target_month || '-01')::DATE
      AND date < (DATE_TRUNC('month', month_year) + INTERVAL '1 month')::DATE
      AND is_recurring = true
    ) THEN
      -- Already processed, skip
      CONTINUE;
    END IF;

    -- Calculate expense date (handle month-end edge cases)
    expense_date := (target_month || '-' || LEAST(expense_record.day_of_month, days_in_month)::TEXT)::DATE;

    -- Insert the expense
    INSERT INTO expenses (
      user_id,
      category_id,
      amount,
      description,
      date,
      is_recurring,
      recurring_expense_id
    ) VALUES (
      target_user_id,
      expense_record.category_id,
      expense_record.amount,
      expense_record.name,
      expense_date,
      true,
      expense_record.id
    );

    processed_count := processed_count + 1;
  END LOOP;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'processed_count', processed_count,
    'total_count', total_count,
    'month', target_month
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'processed_count', processed_count,
    'total_count', total_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get upcoming recurring expenses
CREATE OR REPLACE FUNCTION get_upcoming_recurring_expenses(
  target_user_id UUID,
  days_ahead INT DEFAULT 30
) RETURNS TABLE (
  id UUID,
  name TEXT,
  amount DECIMAL(10,2),
  category_id UUID,
  day_of_month INT,
  next_date DATE,
  days_until INT
) AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  current_day INT := EXTRACT(DAY FROM current_date);
  current_month INT := EXTRACT(MONTH FROM current_date);
  current_year INT := EXTRACT(YEAR FROM current_date);
BEGIN
  RETURN QUERY
  SELECT 
    re.id,
    re.name,
    re.amount,
    re.category_id,
    re.day_of_month,
    CASE 
      WHEN re.day_of_month > current_day THEN
        -- This month
        MAKE_DATE(current_year, current_month, LEAST(re.day_of_month, EXTRACT(DAY FROM DATE_TRUNC('month', current_date) + INTERVAL '1 month' - INTERVAL '1 day')::INT))
      ELSE
        -- Next month
        MAKE_DATE(
          CASE WHEN current_month = 12 THEN current_year + 1 ELSE current_year END,
          CASE WHEN current_month = 12 THEN 1 ELSE current_month + 1 END,
          LEAST(re.day_of_month, EXTRACT(DAY FROM DATE_TRUNC('month', current_date) + INTERVAL '2 months' - INTERVAL '1 day')::INT)
        )
    END AS next_date,
    CASE 
      WHEN re.day_of_month > current_day THEN
        re.day_of_month - current_day
      ELSE
        (DATE_TRUNC('month', current_date) + INTERVAL '1 month' + INTERVAL '1 day' * (re.day_of_month - 1) - current_date)::INT
    END AS days_until
  FROM recurring_expenses re
  WHERE re.user_id = target_user_id 
  AND re.is_active = true
  HAVING days_until <= days_ahead
  ORDER BY next_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check processing status for a month
CREATE OR REPLACE FUNCTION get_recurring_processing_status(
  target_user_id UUID,
  target_month TEXT
) RETURNS TABLE (
  recurring_expense_id UUID,
  recurring_expense_name TEXT,
  recurring_expense_amount DECIMAL(10,2),
  category_id UUID,
  day_of_month INT,
  is_processed BOOLEAN,
  expense_id UUID,
  expense_date DATE
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  -- Calculate month boundaries
  month_start := (target_month || '-01')::DATE;
  month_end := (DATE_TRUNC('month', month_start) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  SELECT 
    re.id as recurring_expense_id,
    re.name as recurring_expense_name,
    re.amount as recurring_expense_amount,
    re.category_id,
    re.day_of_month,
    e.id IS NOT NULL as is_processed,
    e.id as expense_id,
    e.date as expense_date
  FROM recurring_expenses re
  LEFT JOIN expenses e ON (
    e.recurring_expense_id = re.id 
    AND e.user_id = target_user_id 
    AND e.date >= month_start 
    AND e.date <= month_end
    AND e.is_recurring = true
  )
  WHERE re.user_id = target_user_id 
  AND re.is_active = true
  ORDER BY re.day_of_month ASC, re.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION process_monthly_recurring_expenses(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_recurring_expenses(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recurring_processing_status(UUID, TEXT) TO authenticated;

-- Create RPC wrapper functions for easier calling from the client
CREATE OR REPLACE FUNCTION rpc_process_monthly_recurring(target_month TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN process_monthly_recurring_expenses(auth.uid(), target_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_get_upcoming_recurring(days_ahead INT DEFAULT 30)
RETURNS TABLE (
  id UUID,
  name TEXT,
  amount DECIMAL(10,2),
  category_id UUID,
  day_of_month INT,
  next_date DATE,
  days_until INT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_upcoming_recurring_expenses(auth.uid(), days_ahead);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_get_recurring_status(target_month TEXT)
RETURNS TABLE (
  recurring_expense_id UUID,
  recurring_expense_name TEXT,
  recurring_expense_amount DECIMAL(10,2),
  category_id UUID,
  day_of_month INT,
  is_processed BOOLEAN,
  expense_id UUID,
  expense_date DATE
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_recurring_processing_status(auth.uid(), target_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for RPC functions
GRANT EXECUTE ON FUNCTION rpc_process_monthly_recurring(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_upcoming_recurring(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_recurring_status(TEXT) TO authenticated;