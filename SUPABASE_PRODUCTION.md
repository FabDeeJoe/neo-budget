# Supabase Production Configuration

## 1. Authentication Settings

### Site URL Configuration
In your Supabase dashboard under Authentication > URL Configuration:

- **Site URL**: `https://your-domain.vercel.app`
- **Redirect URLs**: Add these URLs:
  - `https://your-domain.vercel.app/auth/callback`
  - `https://your-domain.vercel.app/login`
  - `https://your-domain.vercel.app`

### Email Templates (Optional)
Under Authentication > Email Templates, customize:
- Confirm signup
- Magic link
- Change email address
- Reset password

## 2. Database Configuration

### Row Level Security (RLS)
Ensure RLS is enabled on all tables:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS if not already enabled
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_categories ENABLE ROW LEVEL SECURITY;
```

### Verify Policies
Check that policies exist and are correct:

```sql
-- List all policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected policies:
- `budgets`: Users can view own budgets
- `recurring_expenses`: Users can view own recurring_expenses
- `expenses`: Users can view own expenses
- `favorite_categories`: Users can view own favorites

## 3. API Configuration

### Rate Limiting
In Supabase dashboard under Settings > API:
- Review rate limiting settings
- Consider enabling additional protection for production

### API Keys
- **Anon Key**: Safe to expose (already in environment variables)
- **Service Role Key**: Keep secret, not used in this app

## 4. Performance Optimization

### Database Indexes
Ensure indexes exist on frequently queried columns:

```sql
-- Check existing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorite_categories(user_id);
```

### Connection Pooling
- Default settings should be sufficient for small to medium apps
- Monitor connection usage in Supabase dashboard

## 5. Monitoring & Logging

### Enable Logging
In Supabase dashboard under Logs:
- Enable API logs
- Enable Database logs
- Monitor for errors or unusual activity

### Set up Alerts (Optional)
- Database CPU usage > 80%
- Connection pool usage > 80%
- Error rate > 5%

## 6. Security Checklist

- [ ] RLS enabled on all tables
- [ ] Policies restrict access to user's own data
- [ ] Site URL matches production domain
- [ ] No service role key exposed in client code
- [ ] Database passwords are strong
- [ ] API rate limiting configured

## 7. Backup Configuration

### Automatic Backups
Supabase handles daily backups automatically for paid plans.

### Point-in-Time Recovery
Available for paid plans - consider upgrading for production.

## 8. Environment-Specific Settings

### Development vs Production
- Development: `localhost:3000` in redirect URLs
- Production: `your-domain.vercel.app` in redirect URLs

### Testing
Consider creating a separate Supabase project for staging/testing.

## 9. Migration Management

### Schema Changes
Use Supabase CLI for schema migrations:

```bash
# Initialize migrations (if not done)
supabase init

# Link to production project
supabase link --project-ref your-prod-ref

# Apply migrations
supabase db push
```

### Data Migrations
Handle data migrations carefully in production:
- Test in staging first
- Consider downtime requirements
- Have rollback plan ready

## 10. Troubleshooting Common Issues

### Authentication Not Working
1. Check Site URL matches exactly
2. Verify redirect URLs are correct
3. Check browser console for CORS errors

### Database Connection Issues
1. Verify connection string format
2. Check RLS policies aren't blocking queries
3. Monitor connection pool usage

### Performance Issues
1. Check database indexes
2. Review query performance in Supabase dashboard
3. Consider optimizing complex queries