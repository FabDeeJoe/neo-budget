'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useBudgets } from '@/lib/hooks/use-budgets'
import { useExpenses } from '@/lib/hooks/use-expenses'
import { CATEGORIES } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { getCurrentMonth, getPreviousMonthString } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { SuccessToast } from '@/components/ui/success-toast'
import { ArrowLeft, Copy, TrendingUp, AlertTriangle, Calculator, Star } from 'lucide-react'
import Link from 'next/link'
import { BudgetTemplates, type BudgetTemplate } from '@/components/budget/budget-templates'
import { BudgetDistributionChart } from '@/components/budget/budget-distribution-chart'
import { BudgetIntelligence } from '@/components/budget/budget-intelligence'
import { useHistoricalExpenses } from '@/lib/hooks/use-historical-expenses'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function BudgetSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  
  // État local pour les inputs de budget (éviter de sauvegarder à chaque chiffre)
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({})
  
  const { 
    budgets, 
    loading, 
    error, 
    setBudget, 
    copyFromPreviousMonth,
    getTotalBudget 
  } = useBudgets(selectedMonth)
  
  const {
    expenses,
    getTotalExpenses,
    getExpensesByCategory
  } = useExpenses(selectedMonth)

  const {
    expenses: historicalExpenses,
    loading: historicalLoading
  } = useHistoricalExpenses(6) // 6 months of history

  const handleBudgetUpdate = async (categoryId: string, amount: number) => {
    if (!user) return
    
    try {
      setIsLoading(true)
      await setBudget(categoryId, amount)
      setSuccessMessage('Budget mis à jour')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error updating budget:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleCopyFromPrevious = async () => {
    try {
      setIsLoading(true)
      await copyFromPreviousMonth()
      setSuccessMessage('Budgets copiés du mois précédent')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error copying budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // Apply budget for each category in the template
      const promises = Object.entries(template.categories).map(([categoryId, amount]) =>
        setBudget(categoryId, amount)
      )
      
      await Promise.all(promises)
      
      setSuccessMessage(`Modèle "${template.name}" appliqué avec succès`)
      setShowSuccessToast(true)
      setShowTemplates(false)
    } catch (error) {
      console.error('Error applying template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBudgetForCategory = (categorySlug: string) => {
    // Priorité : valeur locale en cours de saisie > budget sauvegardé
    if (localBudgets[categorySlug] !== undefined) {
      return parseFloat(localBudgets[categorySlug]) || 0
    }
    return budgets.find(b => b.category.slug === categorySlug)?.amount || 0
  }

  const getDisplayBudgetValue = (categorySlug: string) => {
    // Pour l'affichage dans l'input : valeur locale > valeur DB
    if (localBudgets[categorySlug] !== undefined) {
      return localBudgets[categorySlug]
    }
    const budget = budgets.find(b => b.category.slug === categorySlug)?.amount || 0
    return budget.toString()
  }

  const saveBudgetForCategory = async (categorySlug: string, value: string) => {
    const numericValue = parseFloat(value) || 0
    if (numericValue === getBudgetFromDB(categorySlug)) {
      // Pas de changement, pas besoin de sauvegarder
      return
    }
    
    await handleBudgetUpdate(categorySlug, numericValue)
    // Nettoyer l'état local après sauvegarde
    setLocalBudgets(prev => {
      const next = { ...prev }
      delete next[categorySlug]
      return next
    })
  }

  const getBudgetFromDB = (categorySlug: string) => {
    return budgets.find(b => b.category.slug === categorySlug)?.amount || 0
  }

  const getSpentForCategory = (categorySlug: string) => {
    return expenses
      .filter(expense => expense.category.slug === categorySlug)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getUsagePercentage = (categorySlug: string) => {
    const budget = getBudgetForCategory(categorySlug)
    const spent = getSpentForCategory(categorySlug)
    if (budget === 0) return 0
    return Math.round((spent / budget) * 100)
  }

  const totalBudget = getTotalBudget()
  const totalSpent = getTotalExpenses()
  const totalUsagePercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des budgets...</p>
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
                  Configuration des budgets
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedMonth}
                </p>
              </div>
            </div>
            
            {budgets.length === 0 && (
              <Button 
                onClick={handleCopyFromPrevious}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier du mois précédent
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Budget Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Aperçu du budget
            </h2>
            {totalUsagePercentage > 90 && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Budget dépassé
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalBudget)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Budget total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dépensé
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalBudget - totalSpent)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Restant
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalUsagePercentage > 90 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {totalUsagePercentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Utilisé
              </div>
            </div>
          </div>
        </Card>

        {/* Budget Distribution Visualization */}
        {budgets.length > 0 && (
          <BudgetDistributionChart
            budgets={budgets}
            expenses={expenses}
            viewType="pie"
            showSpending={true}
          />
        )}

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
                  <p>Pour configurer vos budgets, vous devez d'abord configurer Supabase :</p>
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

        {/* Budget Intelligence */}
        {!historicalLoading && historicalExpenses.length > 0 && (
          <BudgetIntelligence
            currentBudgets={budgets}
            historicalExpenses={historicalExpenses}
            onApplySuggestion={handleBudgetUpdate}
            disabled={isLoading}
          />
        )}

        {/* Category Budget Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Budgets par catégorie
            </h2>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Star className="h-4 w-4 mr-2" />
                {showTemplates ? 'Masquer les modèles' : 'Modèles de budget'}
              </Button>
              {budgets.length > 0 && (
                <Button 
                  onClick={handleCopyFromPrevious}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier du mois précédent
                </Button>
              )}
            </div>
          </div>

          {/* Budget Templates */}
          {showTemplates && (
            <Card className="p-6">
              <BudgetTemplates
                onApplyTemplate={handleApplyTemplate}
                disabled={isLoading}
              />
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((category) => {
              const currentBudget = getBudgetForCategory(category.id)
              const spent = getSpentForCategory(category.id)
              const usagePercentage = getUsagePercentage(category.id)
              const isOverBudget = spent > currentBudget && currentBudget > 0

              return (
                <Card key={category.id} className="p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      {currentBudget > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {formatCurrency(spent)} / {formatCurrency(currentBudget)} ({usagePercentage}%)
                          {isOverBudget && (
                            <AlertTriangle className="h-3 w-3 ml-1 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Budget Input */}
                    <div>
                      <Label htmlFor={`budget-${category.id}`} className="text-sm font-medium">
                        Budget mensuel (€)
                      </Label>
                      <Input
                        id={`budget-${category.id}`}
                        type="number"
                        value={getDisplayBudgetValue(category.id)}
                        onChange={(e) => {
                          // Update local state only, don't save yet
                          setLocalBudgets(prev => ({
                            ...prev,
                            [category.id]: e.target.value
                          }))
                        }}
                        onBlur={(e) => {
                          // Save when user finishes editing
                          saveBudgetForCategory(category.id, e.target.value)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            // Save on Enter key
                            saveBudgetForCategory(category.id, e.currentTarget.value)
                            e.currentTarget.blur()
                          }
                        }}
                        placeholder="0"
                        className="mt-1"
                        step="1"
                        min="0"
                      />
                    </div>


                    {/* Progress Bar */}
                    {currentBudget > 0 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-200 ${
                            usagePercentage >= 100
                              ? 'bg-red-500'
                              : usagePercentage >= 80
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(usagePercentage, 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
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