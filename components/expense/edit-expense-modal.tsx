'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { X, Check, ChevronDown } from 'lucide-react'

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: any
  onSave: (expenseId: string, updates: any) => Promise<void>
}

export function EditExpenseModal({ isOpen, onClose, expense, onSave }: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    date: '',
    category_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCategorySelector, setShowCategorySelector] = useState(false)

  // Update form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount || 0,
        description: expense.description || '',
        date: expense.date || '',
        category_id: expense.category_id || ''
      })
    }
  }, [expense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (formData.amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0')
      }
      if (!formData.date) {
        throw new Error('La date est requise')
      }
      if (!formData.category_id) {
        throw new Error('Veuillez sélectionner une catégorie')
      }

      await onSave(expense.id, formData)
      onClose()
    } catch (err) {
      console.error('Error updating expense:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = CATEGORIES.find(cat => cat.id === formData.category_id)

  if (!isOpen || !expense) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Modifier la dépense
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Montant *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = value === '' ? 0 : parseFloat(value)
                  setFormData({ ...formData, amount: isNaN(numValue) ? 0 : numValue })
                }}
                placeholder="0.00"
                className="w-full pr-8"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                €
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la dépense..."
              className="w-full"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Catégorie *
            </Label>

            {!showCategorySelector ? (
              <button
                type="button"
                onClick={() => setShowCategorySelector(true)}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between ${
                  formData.category_id
                    ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                {selectedCategory ? (
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{selectedCategory.icon}</span>
                    <span className="text-gray-900 dark:text-white">{selectedCategory.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Sélectionner une catégorie</span>
                )}
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category_id: category.id })
                        setShowCategorySelector(false)
                      }}
                      className={`flex items-center p-3 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        formData.category_id === category.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : ''
                      }`}
                    >
                      <span className="text-lg mr-3">{category.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                      </div>
                      {formData.category_id === category.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}