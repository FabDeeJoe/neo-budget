# CLAUDE.md - Budget Tracker Mobile App

Always read PLANNING.md at the start of every new conversation, check TASKS.md before starting your work, mark completed tasks to TASKS.md immediately, and add newly discovered tasks to TASKS.md when found. 

## Project Overview
Mobile-first budget tracking application with ultra-fast expense entry (2-tap system) and real-time budget monitoring. Built with Next.js, Supabase, and Vercel.

## Core Principle
**SIMPLICITY ABOVE ALL** - Every feature must be achievable in < 10 seconds on mobile. If it takes longer, redesign it.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime)
- **Deployment**: Vercel
- **Database**: PostgreSQL (via Supabase)

## Key Features

### 1. Ultra-Fast Expense Entry (2-tap system)
- User taps FAB → Numeric keyboard opens automatically
- User enters amount → Grid of 6 favorite categories appears
- User taps category → Expense saved automatically
- NO CONFIRMATION NEEDED - Trust the user

### 2. Fixed Categories (14 total)
```javascript
const CATEGORIES = [
  { id: 'subscriptions', name: 'Abonnements & téléphonie', icon: '📱', color: '#8B5CF6' },
  { id: 'auto', name: 'Auto', icon: '🚗', color: '#3B82F6' },
  { id: 'other', name: 'Autres dépenses', icon: '📦', color: '#6B7280' },
  { id: 'gifts', name: 'Cadeaux & solidarité', icon: '🎁', color: '#EC4899' },
  { id: 'education', name: 'Éducation & famille', icon: '👨‍👩‍👧‍👦', color: '#10B981' },
  { id: 'taxes', name: 'Impôts & taxes', icon: '📋', color: '#DC2626' },
  { id: 'housing', name: 'Logement', icon: '🏠', color: '#CA8A04' },
  { id: 'leisure', name: 'Loisirs & sorties', icon: '🎭', color: '#F59E0B' },
  { id: 'cash', name: 'Retrait cash', icon: '💵', color: '#16A34A' },
  { id: 'health', name: 'Santé', icon: '⚕️', color: '#EF4444' },
  { id: 'services', name: 'Services financiers & professionnels', icon: '💼', color: '#1E40AF' },
  { id: 'daily', name: 'Vie quotidienne', icon: '🛒', color: '#059669' },
  { id: 'travel', name: 'Voyages', icon: '✈️', color: '#0EA5E9' },
  { id: 'savings', name: 'Savings', icon: '💰', color: '#84CC16' }
];
```

### 3. Recurring Expenses
- Set once, applied automatically each month
- Mainly for subscriptions and housing costs
- Deducted from budget automatically

### 4. Dashboard
- Show remaining budget per category with progress bars
- Color coding: Green (0-70%) → Orange (70-90%) → Red (90%+)
- Sort categories by consumption percentage (critical first)

## Database Schema

```sql
-- Categories (seeded data, not user-modifiable)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- Monthly budgets per category
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

-- Recurring expenses (subscriptions, rent, etc.)
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- All expenses (manual and recurring)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_expense_id UUID REFERENCES recurring_expenses,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Favorite categories cache (top 6)
CREATE TABLE favorite_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES categories NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  position INTEGER CHECK (position BETWEEN 1 AND 6),
  UNIQUE(user_id, position)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own recurring_expenses" ON recurring_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own favorites" ON favorite_categories FOR ALL USING (auth.uid() = user_id);
```

## File Structure
```
/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx              # Auth check wrapper
│   │   ├── page.tsx                # Dashboard
│   │   ├── expense/
│   │   │   └── new/
│   │   │       └── page.tsx        # Quick expense modal/drawer
│   │   ├── history/
│   │   │   └── page.tsx            # Expense history
│   │   └── settings/
│   │       ├── budgets/
│   │       │   └── page.tsx        # Budget envelopes
│   │       └── recurring/
│   │           └── page.tsx        # Recurring expenses
│   └── layout.tsx                  # Root layout with providers
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/
│   │   ├── budget-card.tsx         # Category budget display
│   │   ├── progress-bar.tsx        # Colored progress indicator
│   │   └── summary-card.tsx        # Total budget summary
│   ├── expense/
│   │   ├── quick-add-fab.tsx       # Floating action button
│   │   ├── amount-input.tsx        # Numeric keyboard input
│   │   ├── category-grid.tsx       # 2x3 favorite categories
│   │   └── expense-form.tsx        # Full form (fallback)
│   ├── layout/
│   │   ├── bottom-nav.tsx          # Mobile navigation
│   │   └── header.tsx               # App header
│   └── providers/
│       ├── supabase-provider.tsx   # Supabase client provider
│       └── auth-provider.tsx       # Auth context
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Auth middleware
│   ├── hooks/
│   │   ├── use-expenses.ts         # Expense operations
│   │   ├── use-budgets.ts          # Budget operations
│   │   ├── use-favorites.ts        # Favorite categories
│   │   └── use-auth.ts             # Auth state
│   └── utils/
│       ├── categories.ts           # Category helpers
│       ├── date.ts                 # Date utilities
│       └── currency.ts             # Format currency
└── styles/
    └── globals.css                  # Tailwind imports
```

## Component Guidelines

### Mobile-First Design Rules
1. **Touch targets**: Minimum 48x48px
2. **Text size**: Base 16px minimum
3. **Spacing**: Use Tailwind's spacing scale (p-4 minimum for touch)
4. **Viewport**: Set `viewport-fit=cover` for iOS safe areas
5. **Bottom nav**: Fixed bottom with 64px height
6. **FAB position**: Bottom-right with 16px margin, above bottom nav

### Quick Add Component (Priority #1)
```tsx
// The most important component - must be perfect
export function QuickAddExpense() {
  // 1. Auto-focus numeric input on mount
  // 2. Show 6 favorite categories after amount entry
  // 3. Single tap on category = save + close
  // 4. Use bottom sheet on mobile (drawer)
  // 5. Haptic feedback on save (if available)
}
```

### Dashboard Cards
```tsx
// Each category shows:
// - Name with icon
// - Progress bar (colored by percentage)
// - Amount spent / Budget total
// - Remaining amount (prominent if positive)
```

## Supabase Configuration

### Initial Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to project
supabase link --project-ref [project-ref]

# Run migrations
supabase db push
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Auth Configuration
- Enable Email auth (magic link preferred)
- Enable Google OAuth
- Set redirect URLs for Vercel deployment

## Performance Requirements
- **LCP**: < 2.5s on 3G
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle size**: < 200KB initial JS
- **Offline**: Read-only mode with service worker

## UI/UX Patterns

### Success Feedback
- Quick toast notification (1.5s duration)
- Subtle haptic feedback on mobile
- Optimistic updates (show immediately, sync in background)

### Error Handling
- Never block the UI
- Inline error messages
- Auto-retry with exponential backoff
- Offline queue for expenses

### Animation Guidelines
- Use `transition-all duration-200` for most transitions
- Slide-up for bottom sheets
- Fade for route changes
- Spring animations for progress bars

## Testing Priorities
1. 2-tap expense flow (< 5 seconds end-to-end)
2. Offline capability
3. Real-time sync between devices
4. Monthly budget rollover
5. Recurring expense automation

## Deployment Checklist
- [ ] Environment variables set in Vercel
- [ ] Supabase RLS policies enabled
- [ ] Database indexes on user_id columns
- [ ] PWA manifest configured
- [ ] Meta tags for mobile viewport
- [ ] Analytics tracking (optional)

## Common Commands
```bash
# Development
npm run dev

# Build
npm run build

# Type checking
npm run type-check

# Supabase types generation
npx supabase gen types typescript --project-ref [ref] > lib/database.types.ts

# Deploy to Vercel
vercel --prod
```

## Critical Success Factors
1. **Expense entry in < 5 seconds** - If it takes longer, we've failed
2. **Works perfectly on iPhone SE** - Smallest viewport is the benchmark
3. **Loads on 3G** - Performance is not optional
4. **Zero learning curve** - Grandma should understand it immediately
5. **Real-time sync** - Changes appear instantly across devices

## Do's and Don'ts

### DO's ✅
- Optimize for thumbs (bottom UI elements)
- Use native patterns (iOS/Android conventions)
- Implement optimistic updates
- Cache aggressively
- Use Tailwind's mobile-first approach
- Test on real devices

### DON'Ts ❌
- Don't add confirmation dialogs
- Don't require landscape orientation
- Don't use small touch targets
- Don't implement complex gestures
- Don't add features "because we can"
- Don't forget about offline users

## Remember
This is a tool people will use multiple times per day, every day. Every millisecond counts. Every tap counts. Make it invisible - the best app is one that gets out of the user's way.

## Session Summary

### Current Status
The Neo Budget mobile app is in production and deployed on Vercel. The core infrastructure is complete with:

- ✅ **Frontend**: Next.js 14 app with mobile-first design
- ✅ **Backend**: Supabase database with proper RLS policies
- ✅ **Authentication**: Working auth system with protected routes
- ✅ **Database**: All tables created with proper relationships
- ✅ **Deployment**: Live on Vercel with proper configuration

### Completed Milestones
1. **Milestone 1-3**: Basic project setup, Supabase integration, auth system
2. **Milestone 4-6**: Core expense tracking, category management, dashboard
3. **Milestone 7**: Complete mobile app with all features working
4. **Milestone 8**: Production deployment and optimization
5. **Milestone 9**: Enhanced UX and mobile shortcut optimization

### Key Features Implemented
- Ultra-fast 2-tap expense entry system
- 14 fixed categories with French localization
- Real-time dashboard with budget progress
- Recurring expenses automation
- Expense history and filtering
- Budget envelope management
- Mobile-optimized UI with bottom navigation
- PWA capabilities

### Latest Session Achievements (Session 9)

#### 🚨 Advanced Budget Alert System
- **3-tier alert system**: Normal → 100% (red static) → >100% (pink pulsing)
- **Real percentage display**: Shows actual percentages like 120%, 150%
- **Visual hierarchy**: Animated alerts for exceeded budgets, static red for exactly 100%
- **Enhanced messaging**: "Budget épuisé" vs "🚨 BUDGET DÉPASSÉ"

#### 📝 Expense Management Enhancements
- **Edit/Delete functionality** in expense history
- **Full modal editor** with category selection and validation
- **Optimistic updates** with success notifications
- **Uniform category handling** for favorites and all categories

#### 📱 Mobile Shortcut Revolution
- **Dedicated route**: `/expense/new` replaces modal approach
- **PWA optimization**: Perfect for mobile home screen shortcuts
- **Streamlined UI**: Removed redundant headers and descriptions
- **Native app feel**: Direct access without navigation

#### 🔧 Technical Improvements
- **Fixed login redirect**: Dashboard → Home page
- **TypeScript compliance**: Proper interfaces and type safety
- **Build optimization**: Clean compilation without warnings
- **Auto-refresh**: Real-time updates for recurring expenses

#### 🎨 UX Refinements
- **Smart budget sorting**: Available budgets first, exceeded last
- **Consistent percentage ordering**: Ascending order within each group
- **Cleaner expense entry**: Removed UI redundancy
- **Better error handling**: Unified category resolution logic

### App Architecture Updates
- **Routes**: Added `/expense/new` as standalone PWA-optimized page
- **Components**: Enhanced budget cards with advanced alert states
- **Modals**: Shifted from modal-based to route-based expense entry
- **PWA**: Optimized metadata for mobile shortcuts and native feel

### Recent Production Deployments
- **Latest**: https://neo-budget-9ys4y7w8a-fabien-dijauds-projects.vercel.app
- **Features**: All enhancements live and tested
- **Performance**: Maintained < 5 second expense entry target

The application now provides a professional-grade expense tracking experience with native app-like performance and mobile shortcut support for instant access.