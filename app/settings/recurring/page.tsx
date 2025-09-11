'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useRecurring } from '@/lib/hooks/use-recurring'
import { CATEGORIES, getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SuccessToast } from '@/components/ui/success-toast'
import { RecurringExpenseForm } from '@/components/recurring/recurring-expense-form'
import { BottomNav } from '@/components/layout/bottom-nav'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function RecurringSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const { 
    recurringExpenses, 
    loading, 
    error, 
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    getUpcomingRecurring
  } = useRecurring()

  // Form success will be handled by the RecurringExpenseForm component itself
  // We just need to listen for when the form closes to show success message

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense récurrente ?')) {
      return
    }
    
    try {
      await deleteRecurringExpense(expenseId)
      setSuccessMessage('Dépense récurrente supprimée')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error deleting recurring expense:', error)
    }
  }

  const handleToggleActive = async (expense: any) => {
    try {
      await updateRecurringExpense(expense.id, { is_active: !expense.is_active })
      setSuccessMessage(expense.is_active ? 'Dépense désactivée' : 'Dépense activée')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error toggling expense:', error)
    }
  }

  const handleEdit = (expense: any) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const handleFormSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
  }

  const upcomingExpenses = getUpcomingRecurring(30) // Next 30 days
  const activeExpenses = recurringExpenses.filter(e => e.is_active)
  const inactiveExpenses = recurringExpenses.filter(e => !e.is_active)
  const totalMonthlyAmount = activeExpenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des dépenses récurrentes...</p>
        </div>
      </div>
    )
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
                  Dépenses récurrentes
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gérez vos abonnements et dépenses fixes
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeExpenses.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Actives
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalMonthlyAmount)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total mensuel
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingExpenses.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Prochaines (30j)
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Database Setup Message */}
        {error && error.includes('Base de données non configurée') && (
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
                  <p>Pour gérer vos dépenses récurrentes, vous devez d'abord configurer Supabase :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Créer un projet Supabase sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">supabase.com</a></li>
                    <li>Configurer les variables d'environnement</li>
                    <li>Exécuter les migrations disponibles dans <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">supabase/migrations/</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Expense Form */}
        <RecurringExpenseForm
          isOpen={showForm}
          onClose={handleCancelForm}
          editingExpense={editingExpense}
          onSuccess={handleFormSuccess}
        />

        {/* Upcoming Expenses */}
        {upcomingExpenses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
              Prochaines échéances (30 jours)
            </h2>
            <div className="space-y-3">
              {upcomingExpenses.slice(0, 10).map((expense) => {
                const category = getCategoryById(expense.category_id)
                
                // Calculate next occurrence date
                const today = new Date()
                const currentDay = today.getDate()
                const currentMonth = today.getMonth()
                const currentYear = today.getFullYear()
                
                let nextDate: Date
                if ((expense.day_of_month || 1) >= currentDay) {
                  // This month
                  nextDate = new Date(currentYear, currentMonth, expense.day_of_month || 1)
                } else {
                  // Next month
                  nextDate = new Date(currentYear, currentMonth + 1, expense.day_of_month || 1)
                }
                
                const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category?.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {expense.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {category?.name} • Dans {daysUntil} jour{daysUntil !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Le {expense.day_of_month}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Active Recurring Expenses */}
        {activeExpenses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dépenses actives ({activeExpenses.length})
            </h2>
            <div className="space-y-3">
              {activeExpenses.map((expense) => {
                const category = getCategoryById(expense.category_id)
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-3">{category?.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {expense.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {category?.name} • Tous les {expense.day_of_month} du mois
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(expense)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <ToggleRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Inactive Expenses */}
        {inactiveExpenses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
              Dépenses inactives ({inactiveExpenses.length})
            </h2>
            <div className="space-y-3">
              {inactiveExpenses.map((expense) => {
                const category = getCategoryById(expense.category_id)
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 opacity-75">
                    <div className="flex items-center flex-1">
                      <span className="text-2xl mr-3 opacity-50">{category?.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-600 dark:text-gray-400">
                          {expense.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {category?.name} • Désactivée
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-semibold text-gray-600 dark:text-gray-400">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(expense)}
                        className="text-gray-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {recurringExpenses.length === 0 && !error && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune dépense récurrente
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ajoutez vos abonnements, loyer et autres dépenses fixes pour un suivi automatique.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter ma première dépense récurrente
            </Button>
          </Card>
        )}
      </div>

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