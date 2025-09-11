# 🚀 Setup Guide - Budget Tracker

This guide will help you set up the Budget Tracker application with Supabase.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)

## Step 1: Clone and Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose an organization (or create one)
5. Fill in:
   - **Project Name**: `neo-budget` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest to your location
6. Wait for the project to be created (1-2 minutes)

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon Key** (public key, safe for client-side use)

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Set Up Database Schema

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```
*You can find your project ref in the Supabase dashboard URL or Settings → General*

4. Push migrations:
```bash
supabase db push
```

### Option B: Manual Setup via Dashboard

1. Go to your Supabase dashboard → **SQL Editor**
2. Run the migration files in order:
   - Copy content from `supabase/migrations/001_initial_schema.sql`
   - Click **Run** 
   - Repeat for all migration files (002, 003, 004)

## Step 6: Verify Setup

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Sign up for a new account
4. You should see the dashboard without database error messages

## Step 7: Test Core Features

### Authentication
- ✅ Sign up with email/password
- ✅ Sign in/out functionality
- ✅ Protected routes working

### Quick Expense Entry (2-tap system)
- ✅ Click the green FAB (floating action button)
- ✅ Enter an amount using the numeric keyboard
- ✅ Select a category (will create the expense)
- ✅ See success toast notification

### Recurring Expenses
- ✅ Go to Settings → Recurring Expenses
- ✅ Add a recurring expense (e.g., Netflix subscription)
- ✅ Test manual monthly processing
- ✅ Verify dashboard shows recurring expenses summary

## 🎯 Key Features Available

| Feature | Status | Description |
|---------|--------|-------------|
| **Authentication** | ✅ Ready | Email/password login system |
| **2-Tap Expense Entry** | ✅ Ready | Ultra-fast expense adding (<5 seconds) |
| **Recurring Expenses** | ✅ Ready | Monthly subscriptions and fixed costs |
| **Dashboard** | ✅ Ready | Overview with month selector |
| **Mobile-First UI** | ✅ Ready | Optimized for mobile devices |
| **Offline Support** | ⚠️ Partial | Basic offline queue (needs refinement) |
| **Budget Management** | 🚧 Coming | Full budget tracking (Milestone 6) |
| **Expense History** | 🚧 Coming | Detailed history and analytics (Milestone 7) |

## 🛠️ Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Generate database types (after schema changes)
npx supabase gen types typescript --project-ref YOUR_PROJECT_REF > lib/database.types.ts
```

## 🚨 Troubleshooting

### "Base de données non configurée" Error
- ✅ Check your `.env.local` file has correct Supabase credentials
- ✅ Verify all migrations have been run
- ✅ Check Supabase project is active (not paused)

### Build Errors
- ✅ Run `npm run build` to check for TypeScript errors
- ✅ Ensure all dependencies are installed
- ✅ Check Node.js version is 18+

### Authentication Issues
- ✅ Verify environment variables are loaded (restart dev server)
- ✅ Check Supabase Auth settings in dashboard
- ✅ Ensure project URL doesn't have trailing slash

## 🎉 Next Steps

Once everything is working:

1. **Add your first recurring expenses** (rent, subscriptions, etc.)
2. **Test the 2-tap expense entry** system
3. **Explore the mobile-responsive interface**
4. **Set up budgets** (coming in Milestone 6)

## 📞 Need Help?

If you encounter issues:
1. Check the console for detailed error messages
2. Verify your Supabase project is active
3. Ensure environment variables are correctly set
4. Try restarting the development server

---

**🚀 Enjoy your ultra-fast budget tracking experience!**