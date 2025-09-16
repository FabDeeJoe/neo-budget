'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { AmountInput } from './amount-input'
import { CategoryGrid } from './category-grid'
import { SuccessToast } from '@/components/ui/success-toast'
import { useExpensesContext } from '@/components/providers/expenses-provider'
import { useFavoriteCategories } from '@/lib/hooks/use-favorites'
import { validateQuickExpense } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import { getCategoryById } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface QuickExpenseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickExpenseModal({ isOpen, onClose }: QuickExpenseModalProps) {
  const [step, setStep] = useState<'amount' | 'category'>('amount')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  
  const { addExpense } = useExpensesContext()
  const { getTopFavorites } = useFavoriteCategories()
  const supabase = createClient()
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('amount')
      setAmount('')
      setError('')
    }
  }, [isOpen])

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

      // Success - show toast and close modal
      setSelectedCategoryName(selectedCategory?.name || 'Catégorie')
      setShowSuccessToast(true)

      setTimeout(() => {
        onClose()
        setLoading(false)
      }, 500)

    } catch (err) {
      console.error('Error adding expense:', err)
      setError('Erreur lors de l\'ajout de la dépense')
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'category') {
      setStep('amount')
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const favoriteCategories = getTopFavorites(6)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'amount' ? 'Montant' : 'Catégorie'}
          </DialogTitle>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {step === 'amount' && (
            <AmountInput
              onSubmit={handleAmountSubmit}
            />
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
      </DialogContent>
    </Dialog>

      <SuccessToast
        isVisible={showSuccessToast}
        message={`${formatCurrency(parseFloat(amount || '0'))} ajouté à ${selectedCategoryName} !`}
        onClose={() => setShowSuccessToast(false)}
      />
    </>
  )
}