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
  displayPercentage: number
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
      percentage: percentage, // Garde le pourcentage réel (peut dépasser 100%)
      displayPercentage: Math.min(100, percentage), // Pour l'affichage de la barre de progression
      status
    }
  }).sort((a, b) => {
    // Nouveau tri : budgets avec de l'argent restant en premier, dépassés en dernier
    const aHasRemaining = a.spentAmount < a.budgetAmount
    const bHasRemaining = b.spentAmount < b.budgetAmount

    if (aHasRemaining && !bHasRemaining) return -1
    if (!aHasRemaining && bHasRemaining) return 1

    // Si les deux ont de l'argent restant, trier par pourcentage croissant (moins utilisé en premier)
    if (aHasRemaining && bHasRemaining) return a.percentage - b.percentage

    // Si les deux sont dépassés, trier par pourcentage croissant aussi (110%, 120%, 150%)
    return a.percentage - b.percentage
  })

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
    if (percentage > 100) return 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse'
    if (percentage === 100) return 'bg-red-500'
    if (percentage >= 90) return 'bg-red-400'
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
          {categoryStatuses.map((catStatus, index) => {
            const isOverBudget = catStatus.spentAmount > catStatus.budgetAmount
            const isExactly100 = catStatus.percentage === 100
            const cardClasses = isOverBudget
              ? 'border-l-4 pl-4 bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-lg p-3 border border-pink-300 dark:border-pink-600 animate-pulse shadow-lg'
              : isExactly100
              ? 'border-l-4 pl-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-300 dark:border-red-600'
              : 'border-l-4 pl-4'

            return (
            <div key={catStatus.category?.id || `category-${index}`} className={cardClasses} style={{
              borderColor: isOverBudget ? '#ec4899' : isExactly100 ? '#dc2626' : (catStatus.category?.color || '#10B981')
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
                    <div className={`font-medium ${
                      isOverBudget
                        ? 'text-pink-800 dark:text-pink-300 font-bold'
                        : isExactly100
                        ? 'text-red-800 dark:text-red-300 font-bold'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {catStatus.percentage.toFixed(0)}%
                    </div>
                    <div className={`text-sm ${
                      isOverBudget
                        ? 'text-pink-700 dark:text-pink-400 font-medium'
                        : isExactly100
                        ? 'text-red-700 dark:text-red-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isOverBudget
                        ? `+${formatCurrency(catStatus.spentAmount - catStatus.budgetAmount)} dépassé`
                        : isExactly100
                        ? "Budget épuisé"
                        : `${formatCurrency(catStatus.remainingAmount)} restant`
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(catStatus.percentage)}`}
                  style={{ width: `${catStatus.displayPercentage}%` }}
                />
              </div>

              {/* Message d'alerte pour budget dépassé */}
              {isOverBudget && (
                <div className="mt-2">
                  <div className="bg-gradient-to-r from-pink-100 to-red-100 dark:from-pink-900/40 dark:to-red-900/40 border border-pink-300 dark:border-pink-600 rounded-lg px-3 py-1">
                    <p className="text-xs text-pink-800 dark:text-pink-300 font-bold text-center">
                      🚨 BUDGET DÉPASSÉ
                    </p>
                  </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}