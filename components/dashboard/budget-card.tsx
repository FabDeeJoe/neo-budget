'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import { CATEGORIES } from '@/lib/categories'
import type { Budget, Category } from '@/lib/database.types'

interface BudgetCardProps {
  budget: Budget & { category: Category }
  spent: number
  percentage: number
}

export function BudgetCard({ budget, spent, percentage }: BudgetCardProps) {
  const remaining = Math.max(budget.amount - spent, 0)
  const isOverBudget = spent > budget.amount
  const realPercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0 // Pourcentage réel (peut dépasser 100%)
  
  const getProgressBarColor = () => {
    if (realPercentage > 100) return 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse'
    if (realPercentage === 100) return 'bg-red-500'
    if (realPercentage >= 90) return 'bg-red-400'
    if (realPercentage >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getCardBorderColor = () => {
    if (realPercentage > 100) return 'border-2 border-pink-400 dark:border-pink-500 shadow-lg shadow-pink-200 dark:shadow-pink-900/50'
    if (realPercentage === 100) return 'border-2 border-red-400 dark:border-red-500'
    if (realPercentage >= 90) return 'border-red-100 dark:border-red-900'
    if (realPercentage >= 70) return 'border-orange-200 dark:border-orange-800'
    return 'border-gray-200 dark:border-gray-700'
  }
  
  const getCategoryStyle = () => {
    const category = CATEGORIES.find(cat => cat.id === budget.category.slug)
    return {
      backgroundColor: category?.color ? `${category.color}15` : '#10B98115',
      color: category?.color || '#10B981'
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${getCardBorderColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Category Icon and Name */}
          <div className="flex items-center space-x-2 min-w-0">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-lg text-sm"
              style={getCategoryStyle()}
            >
              {budget.category.icon}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {budget.category.name}
              </h4>
            </div>
          </div>
          
          {/* Percentage */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            realPercentage > 100
              ? 'bg-gradient-to-r from-pink-100 to-red-100 dark:from-pink-900/50 dark:to-red-900/50 text-pink-800 dark:text-pink-300 animate-pulse border border-pink-300 dark:border-pink-600'
              : realPercentage === 100
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-600'
              : realPercentage >= 70
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          }`}>
            {Math.round(realPercentage)}%
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Amounts */}
        <div className="space-y-2">
          {/* Spent / Budget */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Dépensé
            </span>
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatCurrency(spent)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Budget
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
              {formatCurrency(budget.amount)}
            </span>
          </div>
          
          {/* Remaining or Overspent */}
          <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {isOverBudget ? 'Dépassement' : 'Restant'}
            </span>
            <span className={`font-bold text-sm ${
              isOverBudget 
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {isOverBudget ? `+${formatCurrency(spent - budget.amount)}` : formatCurrency(remaining)}
            </span>
          </div>
        </div>
        
        {/* Status Message */}
        {isOverBudget && (
          <div className="pt-2">
            <div className="bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border border-pink-200 dark:border-pink-800 rounded-lg px-2 py-1 animate-pulse">
              <p className="text-xs text-pink-700 dark:text-pink-300 font-bold text-center">
                🚨 BUDGET DÉPASSÉ
              </p>
            </div>
          </div>
        )}
        
        {percentage >= 90 && !isOverBudget && (
          <div className="pt-2">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              ⚡ Proche de la limite
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}