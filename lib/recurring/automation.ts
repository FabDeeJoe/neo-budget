import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type RecurringExpense = Database['public']['Tables']['recurring_expenses']['Row']

export interface ProcessingResult {
  success: boolean
  processedCount: number
  errors: string[]
  month: string
}

/**
 * Process all active recurring expenses for a given month
 * Creates expense entries for all active recurring expenses
 */
export async function processRecurringExpenses(
  userId: string, 
  month: string
): Promise<ProcessingResult> {
  const supabase = createClient()
  
  const result: ProcessingResult = {
    success: false,
    processedCount: 0,
    errors: [],
    month
  }

  try {
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Expected YYYY-MM')
    }

    // Get all active recurring expenses for the user
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (fetchError) {
      result.errors.push(`Failed to fetch recurring expenses: ${fetchError.message}`)
      return result
    }

    if (!recurringExpenses || recurringExpenses.length === 0) {
      result.success = true
      return result
    }

    // Check if expenses have already been processed for this month
    const [year, monthNum] = month.split('-')
    const startOfMonth = `${month}-01`
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    const endOfMonth = `${month}-${daysInMonth.toString().padStart(2, '0')}`

    const { data: existingExpenses } = await supabase
      .from('expenses')
      .select('recurring_expense_id')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .eq('is_recurring', true)

    const alreadyProcessedIds = new Set(
      existingExpenses?.map(e => e.recurring_expense_id).filter(Boolean) || []
    )

    // Process each recurring expense
    const expensesToCreate = []
    
    for (const recurringExpense of recurringExpenses) {
      // Skip if already processed
      if (alreadyProcessedIds.has(recurringExpense.id)) {
        continue
      }

      // Calculate the actual date for this recurring expense
      const dayOfMonth = Math.min(
        recurringExpense.day_of_month || 1, 
        daysInMonth
      )
      const expenseDate = `${year}-${monthNum.padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`

      expensesToCreate.push({
        user_id: userId,
        category_id: recurringExpense.category_id,
        amount: recurringExpense.amount,
        description: recurringExpense.name,
        date: expenseDate,
        is_recurring: true,
        recurring_expense_id: recurringExpense.id
      })
    }

    if (expensesToCreate.length === 0) {
      result.success = true
      return result
    }

    // Insert all expense entries in batch
    const { error: insertError } = await supabase
      .from('expenses')
      .insert(expensesToCreate)

    if (insertError) {
      result.errors.push(`Failed to create expenses: ${insertError.message}`)
      return result
    }

    result.success = true
    result.processedCount = expensesToCreate.length

  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error occurred'
    )
  }

  return result
}

/**
 * Get upcoming recurring expenses for the next N days
 */
export async function getUpcomingRecurringExpenses(
  userId: string, 
  daysAhead: number = 30
): Promise<Array<RecurringExpense & { nextDate: string }>> {
  const supabase = createClient()

  try {
    const { data: recurringExpenses, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error || !recurringExpenses) {
      return []
    }

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    return recurringExpenses
      .map(expense => {
        const dayOfMonth = expense.day_of_month || 1
        let nextDate: Date

        // If the day hasn't passed this month, next occurrence is this month
        if (dayOfMonth > currentDay) {
          nextDate = new Date(currentYear, currentMonth, dayOfMonth)
        } else {
          // Otherwise, next occurrence is next month
          nextDate = new Date(currentYear, currentMonth + 1, dayOfMonth)
          
          // Handle month overflow (e.g., if current month is December)
          if (nextDate.getMonth() !== (currentMonth + 1) % 12) {
            // Day doesn't exist in next month (e.g., Feb 31st), use last day of month
            nextDate = new Date(currentYear, currentMonth + 2, 0)
          }
        }

        return {
          ...expense,
          nextDate: nextDate.toISOString().split('T')[0]
        }
      })
      .filter(expense => {
        const daysUntilNext = Math.ceil(
          (new Date(expense.nextDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilNext <= daysAhead
      })
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
  } catch (error) {
    console.error('Error getting upcoming recurring expenses:', error)
    return []
  }
}

/**
 * Check if a recurring expense has already been processed for a given month
 */
export async function isRecurringExpenseProcessed(
  userId: string,
  recurringExpenseId: string,
  month: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const [year, monthNum] = month.split('-')
    const startOfMonth = `${month}-01`
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    const endOfMonth = `${month}-${daysInMonth.toString().padStart(2, '0')}`

    const { data, error } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', userId)
      .eq('recurring_expense_id', recurringExpenseId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .limit(1)

    if (error) {
      console.error('Error checking if recurring expense is processed:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking recurring expense processing status:', error)
    return false
  }
}

/**
 * Get processing status for all recurring expenses in a given month
 */
export async function getRecurringExpenseProcessingStatus(
  userId: string,
  month: string
): Promise<Array<{
  recurringExpense: RecurringExpense
  processed: boolean
  expenseId?: string
}>> {
  const supabase = createClient()

  try {
    // Get all active recurring expenses
    const { data: recurringExpenses, error: recurringError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (recurringError || !recurringExpenses) {
      return []
    }

    // Get expenses for this month
    const [year, monthNum] = month.split('-')
    const startOfMonth = `${month}-01`
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    const endOfMonth = `${month}-${daysInMonth.toString().padStart(2, '0')}`

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, recurring_expense_id')
      .eq('user_id', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .eq('is_recurring', true)

    if (expensesError) {
      return recurringExpenses.map(re => ({
        recurringExpense: re,
        processed: false
      }))
    }

    const processedMap = new Map(
      expenses?.map(e => [e.recurring_expense_id, e.id]) || []
    )

    return recurringExpenses.map(recurringExpense => ({
      recurringExpense,
      processed: processedMap.has(recurringExpense.id),
      expenseId: processedMap.get(recurringExpense.id)
    }))
  } catch (error) {
    console.error('Error getting recurring expense processing status:', error)
    return []
  }
}

/**
 * Calculate total amount of recurring expenses for a month
 */
export function calculateMonthlyRecurringTotal(
  recurringExpenses: RecurringExpense[]
): number {
  return recurringExpenses
    .filter(expense => expense.is_active)
    .reduce((total, expense) => total + expense.amount, 0)
}