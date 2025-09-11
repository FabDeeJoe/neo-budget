'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CATEGORIES, getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { PieChart, BarChart3 } from 'lucide-react'

interface BudgetDistributionChartProps {
  budgets: Array<{
    category_id: string
    amount: number
    category: { 
      id: string
      slug: string
      name: string
      icon: string
      color: string
      display_order: number 
    }
  }>
  expenses?: Array<{
    category_id: string
    category: {
      slug: string
    }
    amount: number
  }>
  viewType?: 'pie' | 'bar'
  showSpending?: boolean
}

export function BudgetDistributionChart({ 
  budgets, 
  expenses = [], 
  viewType = 'pie',
  showSpending = false 
}: BudgetDistributionChartProps) {
  const chartData = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
    
    return budgets
      .map(budget => {
        const category = getCategoryById(budget.category.slug)
        if (!category) return null
        
        const spent = expenses
          .filter(e => e.category.slug === budget.category.slug)
          .reduce((sum, e) => sum + e.amount, 0)
        
        const percentage = totalBudget > 0 ? (budget.amount / totalBudget) * 100 : 0
        const spentPercentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        
        return {
          categoryId: budget.category.slug,
          name: category.name,
          icon: category.icon,
          color: category.color,
          budgetAmount: budget.amount,
          spentAmount: spent,
          percentage,
          spentPercentage,
          displayOrder: budget.category.display_order
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [budgets, expenses])

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (chartData.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-400 dark:text-gray-600 mb-2">
          <PieChart className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Aucun budget configuré pour afficher la répartition
        </p>
      </Card>
    )
  }

  if (viewType === 'bar') {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Répartition du budget
          </h3>
        </div>
        
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.budgetAmount)}
                  </span>
                </div>
              </div>
              
              {/* Budget Bar */}
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: item.color,
                    width: `${item.percentage}%`
                  }}
                />
                
                {/* Spending overlay */}
                {showSpending && item.spentAmount > 0 && (
                  <div
                    className="absolute top-0 h-4 rounded-full bg-black/20 transition-all duration-300"
                    style={{
                      width: `${Math.min(item.spentPercentage * (item.percentage / 100), item.percentage)}%`
                    }}
                  />
                )}
              </div>
              
              {showSpending && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Dépensé: {formatCurrency(item.spentAmount)}</span>
                  <span>Restant: {formatCurrency(item.budgetAmount - item.spentAmount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // Pie chart view
  const radius = 80
  const circumference = 2 * Math.PI * radius
  let accumulatedPercentage = 0

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <PieChart className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Répartition du budget
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-6">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
              {chartData.map((item) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
                const strokeDashoffset = -accumulatedPercentage * circumference / 100
                
                const element = (
                  <circle
                    key={item.categoryId}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="16"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                )
                
                accumulatedPercentage += item.percentage
                return element
              })}
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalBudget)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Budget total
              </div>
              {showSpending && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {formatCurrency(totalSpent)} dépensé
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          {chartData.map((item) => (
            <div 
              key={item.categoryId} 
              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(item.budgetAmount)} ({item.percentage.toFixed(1)}%)
                  {showSpending && (
                    <span className="block">
                      Dépensé: {formatCurrency(item.spentAmount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSpending && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalBudget)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Budget total
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dépensé
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalBudget - totalSpent)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Restant
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}