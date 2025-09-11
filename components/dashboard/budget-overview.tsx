'use client'

import { useBudgets } from '@/lib/hooks/use-budgets'
import { useExpensesContext } from '@/components/providers/expenses-provider'
import { CATEGORIES, getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Settings, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface BudgetOverviewProps {
  month: string // YYYY-MM format
}

interface CategoryBudgetStatus {
  category: any
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentage: number
  status: 'good' | 'warning' | 'danger'
}

export function BudgetOverview({ month }: BudgetOverviewProps) {
  const { budgets, loading: budgetsLoading } = useBudgets(month)
  const { getMonthlyExpensesByCategory, loading: expensesLoading } = useExpensesContext()

  if (budgetsLoading || expensesLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  // Si aucun budget configuré
  if (!budgets || budgets.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun budget configuré
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configurez vos budgets mensuels pour suivre vos dépenses par catégorie.
        </p>
        <Link href="/settings/budgets">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Settings className="h-4 w-4 mr-2" />
            Configurer mes budgets
          </Button>
        </Link>
      </Card>
    )
  }

  // Calculer le statut de chaque catégorie
  const categoryStatuses: CategoryBudgetStatus[] = budgets.map(budget => {
    // Use budget.category directly since it's included in the query from the database
    const category = budget.category
    const spentAmount = getMonthlyExpensesByCategory(budget.category_id, month)
    const remainingAmount = Math.max(0, budget.amount - spentAmount)
    const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0
    
    let status: 'good' | 'warning' | 'danger' = 'good'
    if (percentage >= 90) status = 'danger'
    else if (percentage >= 70) status = 'warning'

    return {
      category,
      budgetAmount: budget.amount,
      spentAmount,
      remainingAmount,
      percentage: Math.min(100, percentage),
      status
    }
  }).sort((a, b) => b.percentage - a.percentage) // Trier par % utilisé (plus critique en premier)

  const totalBudget = categoryStatuses.reduce((sum, cat) => sum + cat.budgetAmount, 0)
  const totalSpent = categoryStatuses.reduce((sum, cat) => sum + cat.spentAmount, 0)
  const totalRemaining = Math.max(0, totalBudget - totalSpent)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <TrendingUp className="h-4 w-4 text-orange-500" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            État du budget - {month}
          </h2>
          <Link href="/settings/budgets">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Gérer
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Dépensé
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Restant
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Utilisé
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progression globale</span>
            <span>{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(overallPercentage)}`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Détail par catégorie */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Budgets par catégorie
        </h3>
        
        <div className="space-y-4">
          {categoryStatuses.map((catStatus, index) => (
            <div key={catStatus.category?.id || `category-${index}`} className="border-l-4 pl-4" style={{
              borderColor: catStatus.category?.color || '#10B981'
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{catStatus.category?.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {catStatus.category?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(catStatus.spentAmount)} / {formatCurrency(catStatus.budgetAmount)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(catStatus.status)}
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {catStatus.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(catStatus.remainingAmount)} restant
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(catStatus.percentage)}`}
                  style={{ width: `${catStatus.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}