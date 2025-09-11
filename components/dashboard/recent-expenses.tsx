'use client'

import { useExpensesContext } from '@/components/providers/expenses-provider'
import { getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, Calendar, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RecentExpensesProps {
  month?: string // Si fourni, limite aux dépenses du mois
  limit?: number // Nombre de dépenses à afficher
}

export function RecentExpenses({ month, limit = 10 }: RecentExpensesProps) {
  const { getExpensesByMonth, expenses, loading } = useExpensesContext()

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <History className="h-5 w-5 mr-2" />
            Dernières dépenses
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // Filtrer et trier les dépenses
  let filteredExpenses = month ? getExpensesByMonth(month) : expenses

  // Trier par date (plus récent en premier) et limiter
  const recentExpenses = filteredExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: fr })
    } catch {
      return dateString
    }
  }

  const formatExpenseDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return "Aujourd'hui"
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Hier"
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short'
        })
      }
    } catch {
      return dateString
    }
  }

  if (recentExpenses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-4xl mb-4">💸</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune dépense {month ? 'ce mois-ci' : 'enregistrée'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {month 
            ? 'Commencez à ajouter vos dépenses avec le bouton vert.'
            : 'Vos dépenses apparaîtront ici une fois ajoutées.'
          }
        </p>
        <div className="text-2xl">
          👆 <span className="text-sm text-gray-500">Utilisez le bouton vert en bas à droite</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <History className="h-5 w-5 mr-2" />
          {month ? `Dépenses ${month}` : 'Dernières dépenses'}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({recentExpenses.length})
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {recentExpenses.map((expense) => {
          const category = getCategoryById(expense.category_id)
          
          return (
            <div 
              key={expense.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: category?.color || '#10B981' }}
                >
                  <span className="text-lg">{category?.icon || '💰'}</span>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {expense.description || category?.name || 'Dépense'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatExpenseDate(expense.date)}</span>
                    {expense.is_recurring && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                        Récurrent
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {category?.name}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bouton Voir tout en bas */}
      {recentExpenses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link href="/history">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              Voir toutes les dépenses
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}