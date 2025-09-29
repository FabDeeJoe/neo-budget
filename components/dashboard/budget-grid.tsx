'use client'

import { BudgetCard } from './budget-card'
import type { Budget, Category } from '@/lib/database.types'

interface ExpenseByCategory {
  category: Category
  expenses: any[]
  total: number
}

interface BudgetGridProps {
  budgets: (Budget & { category: Category })[]
  expenses: ExpenseByCategory[]
  categories: Category[]
  currentMonth: string
}

export function BudgetGrid({ budgets, expenses, categories, currentMonth }: BudgetGridProps) {
  // Create a map of expenses by category ID for quick lookup
  const expenseMap = expenses.reduce((acc, exp) => {
    acc[exp.category.id] = exp.total
    return acc
  }, {} as Record<string, number>)

  // Combine budgets with expense data and sort by consumption percentage (critical first)
  const budgetsWithExpenses = budgets.map(budget => {
    const spent = expenseMap[budget.category_id] || 0
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

    return {
      ...budget,
      spent,
      percentage // Garde le pourcentage réel (peut dépasser 100%)
    }
  }).sort((a, b) => {
    // Nouveau tri : budgets avec de l'argent restant en premier, dépassés en dernier
    const aHasRemaining = a.spent < a.amount
    const bHasRemaining = b.spent < b.amount

    if (aHasRemaining && !bHasRemaining) return -1
    if (!aHasRemaining && bHasRemaining) return 1

    // Si les deux ont de l'argent restant, trier par pourcentage croissant (moins utilisé en premier)
    if (aHasRemaining && bHasRemaining) return a.percentage - b.percentage

    // Si les deux sont dépassés, trier par pourcentage croissant aussi (110%, 120%, 150%)
    return a.percentage - b.percentage
  })

  if (budgetsWithExpenses.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Budgets par catégorie
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {budgetsWithExpenses.length} catégorie{budgetsWithExpenses.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetsWithExpenses.map((budget, index) => (
          <div
            key={budget.id}
            className="animate-slideUp"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <BudgetCard
              budget={budget}
              spent={budget.spent}
              percentage={budget.percentage}
            />
          </div>
        ))}
      </div>
    </div>
  )
}