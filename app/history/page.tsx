'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useExpensesContext } from '@/components/providers/expenses-provider'
import { formatCurrency } from '@/lib/currency'
import { getCurrentMonth } from '@/lib/date'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuccessToast } from '@/components/ui/success-toast'
import { EditExpenseModal } from '@/components/expense/edit-expense-modal'
import { ArrowLeft, Calendar, Filter, Trash2, Edit } from 'lucide-react'
import { BottomNav } from '@/components/layout/bottom-nav'
import Link from 'next/link'

export default function HistoryPage() {
  const { user } = useAuth()
  const { expenses, loading, getExpensesByMonth, updateExpense, deleteExpense } = useExpensesContext()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  const monthlyExpenses = getExpensesByMonth(selectedMonth)
  const totalAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const formatExpenseDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return
    }

    try {
      await deleteExpense(expenseId)
      setSuccessMessage('Dépense supprimée')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleSaveExpense = async (expenseId: string, updates: any) => {
    try {
      await updateExpense(expenseId, updates)
      setSuccessMessage('Dépense modifiée')
      setShowSuccessToast(true)
      setEditingExpense(null)
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-3">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Historique des dépenses
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedMonth} • {monthlyExpenses.length} dépense{monthlyExpenses.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-32 space-y-6">
        {/* Month Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Résumé {selectedMonth}
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total dépensé
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {monthlyExpenses.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dépenses
              </div>
            </div>
          </div>
        </Card>

        {/* Expenses List */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Détail des dépenses
          </h3>
          
          {monthlyExpenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune dépense ce mois-ci
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vos dépenses apparaîtront ici une fois ajoutées.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: expense.category?.color || '#10B981' }}
                    >
                      <span className="text-lg">{expense.category?.icon || '💰'}</span>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {expense.description || expense.category?.name || 'Dépense'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                        <span>{formatExpenseDate(expense.date)}</span>
                        <span>•</span>
                        <span>{expense.category?.name}</span>
                        {expense.is_recurring && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                              Récurrent
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right mr-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>

                    {/* Edit and Delete buttons */}
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditExpense(expense)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        onSave={handleSaveExpense}
      />

      {/* Success Toast */}
      <SuccessToast
        isVisible={showSuccessToast}
        message={successMessage}
        onClose={() => setShowSuccessToast(false)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}