'use client'

import { formatCurrency } from '@/lib/currency'
import { RecurringBadge } from '@/components/ui/recurring-badge'
import { CATEGORIES } from '@/lib/categories'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  category: Database['public']['Tables']['categories']['Row']
  recurring_expense?: {
    id: string
    name: string
  } | null
}

interface ExpenseListProps {
  expenses: Expense[]
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  showActions?: boolean
  showDate?: boolean
  compact?: boolean
}

export function ExpenseList({ 
  expenses, 
  onEdit, 
  onDelete, 
  showActions = false,
  showDate = true,
  compact = false
}: ExpenseListProps) {
  const getCategoryInfo = (categorySlug: string) => {
    return CATEGORIES.find(cat => cat.id === categorySlug) || {
      name: 'Catégorie inconnue',
      icon: '📦',
      color: '#6B7280'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (compact) {
      return format(date, 'dd/MM', { locale: fr })
    }
    return format(date, 'dd MMM yyyy', { locale: fr })
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-2xl mb-2">💸</div>
        <p className="text-sm">Aucune dépense pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const categoryInfo = getCategoryInfo(expense.category?.slug || '')
        const isRecurring = expense.is_recurring && expense.recurring_expense_id
        
        return (
          <div
            key={expense.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-sm ${
              compact ? 'p-3' : 'p-4'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                {/* Category Icon */}
                <div 
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    compact ? 'w-8 h-8' : 'w-10 h-10'
                  }`}
                  style={{ backgroundColor: `${categoryInfo.color}15` }}
                >
                  <span className={compact ? 'text-base' : 'text-lg'}>
                    {categoryInfo.icon}
                  </span>
                </div>

                {/* Expense Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium text-gray-900 dark:text-white truncate ${
                      compact ? 'text-sm' : 'text-base'
                    }`}>
                      {expense.description || categoryInfo.name}
                    </h3>
                    
                    {isRecurring && (
                      <RecurringBadge size={compact ? 'sm' : 'md'} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className={`text-gray-500 dark:text-gray-400 ${
                      compact ? 'text-xs' : 'text-sm'
                    }`}>
                      {categoryInfo.name}
                    </p>
                    
                    {showDate && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <p className={`text-gray-500 dark:text-gray-400 ${
                          compact ? 'text-xs' : 'text-sm'
                        }`}>
                          {formatDate(expense.date)}
                        </p>
                      </>
                    )}
                    
                    {isRecurring && expense.recurring_expense?.name && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <p className={`text-blue-600 dark:text-blue-400 italic ${
                          compact ? 'text-xs' : 'text-sm'
                        }`}>
                          {expense.recurring_expense.name}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-center gap-3">
                <div className={`font-semibold text-gray-900 dark:text-white ${
                  compact ? 'text-sm' : 'text-base'
                }`}>
                  {formatCurrency(expense.amount)}
                </div>

                {showActions && (onEdit || onDelete) && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={() => onDelete(expense)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Additional recurring info */}
            {isRecurring && !compact && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Cette dépense a été générée automatiquement depuis vos dépenses récurrentes
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}