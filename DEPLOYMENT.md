# Deployment Guide - Neo Budget

## Prerequisites

1. **Supabase Project**: Ensure your Supabase project is set up with:
   - Database tables created (see `supabase/migrations/`)
   - Row Level Security (RLS) policies enabled
   - Authentication configured (Email + optional Google OAuth)

2. **Vercel Account**: Sign up at https://vercel.com

## Environment Variables

Set these in Vercel Dashboard under Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Option 2: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

## Supabase Configuration for Production

1. **Authentication Redirect URLs**:
   - Add your production domain to Site URL in Supabase Auth settings
   - Example: `https://neo-budget.vercel.app`

2. **API Settings**:
   - Ensure RLS is enabled on all tables
   - Verify authentication policies are correctly configured

## Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Test expense creation
- [ ] Test recurring expenses
- [ ] Test budget management
- [ ] Verify mobile responsiveness
- [ ] Check PWA installation
- [ ] Test offline functionality (if implemented)

## Performance Monitoring

The app is optimized for:
- LCP < 2.5s on 3G
- Bundle size < 200KB initial JS
- Mobile-first design

## Troubleshooting

**Authentication Issues**:
- Check Supabase Auth redirect URLs
- Verify environment variables are set correctly

**Database Connection Issues**:
- Check Supabase URL and anon key
- Verify RLS policies allow authenticated users

**Build Failures**:
- Run `npm run build` locally first
- Check for TypeScript errors
- Verify all imports are correct