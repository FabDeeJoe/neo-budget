'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import { getRemainingDaysInMonth } from '@/lib/date'
import { TrendingUp, TrendingDown, Calendar, Euro } from 'lucide-react'

interface BudgetSummaryProps {
  totalSpent: number
  totalBudget: number
  currentMonth: string
}

export function BudgetSummary({ totalSpent, totalBudget, currentMonth }: BudgetSummaryProps) {
  const remaining = totalBudget - totalSpent
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const remainingDays = getRemainingDaysInMonth()
  const dailyBudgetRemaining = remainingDays > 0 ? remaining / remainingDays : 0
  
  const getStatusColor = () => {
    if (spentPercentage >= 100) return 'text-red-600 dark:text-red-400'
    if (spentPercentage >= 80) return 'text-orange-600 dark:text-orange-400'
    return 'text-green-600 dark:text-green-400'
  }
  
  const getProgressBarColor = () => {
    if (spentPercentage >= 100) return 'bg-red-500'
    if (spentPercentage >= 80) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 border-green-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Euro className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
          Résumé du budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progression
            </span>
            <span className={`text-sm font-semibold ${getStatusColor()}`}>
              {Math.round(spentPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Spent */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Dépensé</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          {/* Budget Total */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Budget</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalBudget)}
            </p>
          </div>

          {/* Remaining */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <TrendingDown className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Restant</span>
            </div>
            <p className={`text-lg font-bold ${getStatusColor()}`}>
              {formatCurrency(Math.max(remaining, 0))}
            </p>
            {remaining < 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Dépassement de {formatCurrency(Math.abs(remaining))}
              </p>
            )}
          </div>

          {/* Daily Budget */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Par jour</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {dailyBudgetRemaining > 0 ? formatCurrency(dailyBudgetRemaining) : formatCurrency(0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {remainingDays} jours restants
            </p>
          </div>
        </div>

        {/* Warning Message */}
        {spentPercentage >= 80 && (
          <div className={`p-3 rounded-lg ${
            spentPercentage >= 100 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
          }`}>
            <p className="text-sm font-medium">
              {spentPercentage >= 100 
                ? '⚠️ Budget dépassé ! Attention aux dépenses.'
                : '⚡ Attention, vous approchez de votre limite budgétaire.'
              }
            </p>
          </div>
        )}

        {/* Success Message */}
        {spentPercentage < 50 && totalBudget > 0 && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <p className="text-sm font-medium">
              ✅ Excellent ! Vous gérez bien votre budget ce mois-ci.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}