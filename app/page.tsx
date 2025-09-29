'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { MonthSelector } from '@/components/dashboard/month-selector'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { QuickAddFAB } from '@/components/expense/quick-add-fab'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useRecurring } from '@/lib/hooks/use-recurring'
import { useBudgets } from '@/lib/hooks/use-budgets'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import { getCurrentMonth } from '@/lib/date'
import { Settings, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  
  const {
    recurringExpenses,
    loading: recurringLoading,
    error: recurringError,
    getUpcomingRecurring,
    refetch: refreshRecurring
  } = useRecurring()

  const { budgets, loading: budgetsLoading, refetch: refreshBudgets } = useBudgets(selectedMonth)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const upcomingRecurring = getUpcomingRecurring(7) // Next 7 days
  const activeRecurringCount = recurringExpenses.filter(e => e.is_active).length
  const monthlyRecurringTotal = recurringExpenses
    .filter(e => e.is_active)
    .reduce((total, e) => total + e.amount, 0)

  const hasAnyBudgets = budgets && budgets.length > 0
  const hasDatabaseError = Boolean(recurringError && recurringError.includes('Base de données non configurée'))

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([
      refreshBudgets?.(),
      refreshRecurring?.()
    ])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <DashboardHeader
        user={user}
        isOnline={isOnline}
        queueLength={queueLength}
      />

      {/* Main Content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} disabled={hasDatabaseError}>
        <div className="max-w-4xl mx-auto p-4 pb-32 space-y-6 animate-fadeIn">
        {/* Month Selector */}
        <MonthSelector
          currentMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Database Setup Message */}
        {hasDatabaseError && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="text-2xl">🛠️</div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Configuration de la base de données requise
                </h3>
                <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                  <p>Pour utiliser pleinement l'application, vous devez configurer Supabase :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Créer un projet Supabase sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">supabase.com</a></li>
                    <li>Configurer les variables d'environnement <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code> et <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                    <li>Exécuter les migrations disponibles dans <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">supabase/migrations/</code></li>
                  </ol>
                  <p className="pt-2 text-xs">
                    💡 En attendant, vous pouvez explorer l'interface et tester le système d'ajout rapide de dépenses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        {!hasDatabaseError && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Budget Overview (2/3 width) */}
            <div className="lg:col-span-2">
              <BudgetOverview month={selectedMonth} />
            </div>
            
            {/* Right Column - Recent Expenses + Quick Info */}
            <div className="space-y-6">
              {/* Recent Expenses */}
              <RecentExpenses month={selectedMonth} limit={8} />
              
              {/* Recurring Expenses Summary */}
              {activeRecurringCount > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Récurrentes
                      </h3>
                    </div>
                    <Link href="/settings/recurring">
                      <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800">
                        <Settings className="h-4 w-4 mr-1" />
                        Gérer
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {activeRecurringCount}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Actives
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(monthlyRecurringTotal)}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        /mois
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Setup Call-to-Actions for New Users */}
        {!hasDatabaseError && !hasAnyBudgets && activeRecurringCount === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Budget Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Configurer mes budgets
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Définissez vos budgets mensuels par catégorie.
              </p>
              <Link href="/settings/budgets">
                <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </Link>
            </div>

            {/* Recurring Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Dépenses récurrentes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Automatisez vos abonnements et dépenses fixes.
              </p>
              <Link href="/settings/recurring">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </Link>
            </div>
          </div>
        )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <QuickAddFAB />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
