'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/expense/amount-input'
import { CategoryGrid } from '@/components/expense/category-grid'
import { SuccessToast } from '@/components/ui/success-toast'
import { useExpensesContext } from '@/components/providers/expenses-provider'
import { useFavoriteCategories } from '@/lib/hooks/use-favorites'
import { validateQuickExpense } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import { getCategoryById } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Home } from 'lucide-react'

export default function NewExpensePage() {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'category'>('amount')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedCategoryName, setSelectedCategoryName] = useState('')

  const { addExpense } = useExpensesContext()
  const { getTopFavorites } = useFavoriteCategories()
  const supabase = createClient()

  // Reset state on page load
  useEffect(() => {
    setStep('amount')
    setAmount('')
    setError('')
  }, [])

  const handleAmountSubmit = (enteredAmount: string) => {
    const numAmount = parseFloat(enteredAmount)

    // Validate amount
    const validation = validateQuickExpense({
      amount: numAmount,
      category_id: 'temp' // Temporary, will be replaced
    })

    if (!validation.success) {
      setError('Montant invalide')
      return
    }

    setAmount(enteredAmount)
    setStep('category')
  }

  const handleCategorySelect = async (categoryIdentifier: string) => {
    setLoading(true)
    setError('')

    try {
      const numAmount = parseFloat(amount)
      let categoryId: string
      let selectedCategory: any

      // Check if it's already a UUID (favorite categories) or a slug (all categories)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryIdentifier)

      if (isUUID) {
        // It's a favorite category with UUID
        categoryId = categoryIdentifier
        const favoriteCategory = favoriteCategories.find(cat => cat.id === categoryIdentifier)
        selectedCategory = favoriteCategory ? getCategoryById(favoriteCategory.slug) : null
      } else {
        // It's a category slug, need to get UUID from database
        const { data: categories } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categoryIdentifier)
          .single()

        if (!categories) {
          setError('Catégorie introuvable')
          setLoading(false)
          return
        }

        categoryId = categories.id
        selectedCategory = getCategoryById(categoryIdentifier)
      }

      await addExpense({
        amount: numAmount,
        category_id: categoryId,
        date: new Date().toISOString().split('T')[0] // Today's date
      })

      // Success - show toast and redirect after delay
      setSelectedCategoryName(selectedCategory?.name || 'Catégorie')
      setShowSuccessToast(true)

      setTimeout(() => {
        router.push('/')
      }, 1500)

    } catch (err) {
      console.error('Error adding expense:', err)
      setError('Erreur lors de l\'ajout de la dépense')
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'category') {
      setStep('amount')
    } else {
      router.push('/')
    }
  }

  const favoriteCategories = getTopFavorites(6)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={loading}
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {step === 'amount' ? 'Nouvelle dépense' : 'Catégorie'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ajout rapide de dépense
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              disabled={loading}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {step === 'amount' && (
            <AmountInput onSubmit={handleAmountSubmit} />
          )}

          {step === 'category' && (
            <CategoryGrid
              categories={favoriteCategories}
              amount={amount}
              onSelect={handleCategorySelect}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>

        {/* PWA Tips */}
        {step === 'amount' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <div className="text-2xl mr-3">📱</div>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Raccourci rapide
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Ajoutez cette page à votre écran d'accueil pour un accès ultra-rapide !
                  </p>
                  <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p><strong>iPhone/iPad :</strong> Safari → Partager → Sur l'écran d'accueil</p>
                    <p><strong>Android :</strong> Chrome → Menu → Ajouter à l'écran d'accueil</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start">
                <div className="text-2xl mr-3">⚡</div>
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                    Système 2-tap
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    1. Entrez le montant → 2. Choisissez la catégorie → Terminé !
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      <SuccessToast
        isVisible={showSuccessToast}
        message={`${formatCurrency(parseFloat(amount || '0'))} ajouté à ${selectedCategoryName} !`}
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  )
}