'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecurring } from '@/lib/hooks/use-recurring'
import { CATEGORIES } from '@/lib/categories'
import { RecurringExpenseInput } from '@/lib/schemas'
import { X, Check, ChevronDown } from 'lucide-react'

interface RecurringExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  editingExpense?: any // RecurringExpense type to be added when available
  onSuccess?: (message: string) => void // Add success callback
}

export function RecurringExpenseForm({ isOpen, onClose, editingExpense, onSuccess }: RecurringExpenseFormProps) {
  const { addRecurringExpense, updateRecurringExpense } = useRecurring()
  
  const [formData, setFormData] = useState<RecurringExpenseInput>({
    name: editingExpense?.name || '',
    amount: editingExpense?.amount || 0,
    category_id: editingExpense?.category_id || '',
    day_of_month: editingExpense?.day_of_month || 1,
    is_active: editingExpense?.is_active ?? true
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCategorySelector, setShowCategorySelector] = useState(false)

  // Update form data when editingExpense changes
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        name: editingExpense.name || '',
        amount: editingExpense.amount || 0,
        category_id: editingExpense.category_id || '',
        day_of_month: editingExpense.day_of_month || 1,
        is_active: editingExpense.is_active ?? true
      })
    } else {
      setFormData({
        name: '',
        amount: 0,
        category_id: '',
        day_of_month: 1,
        is_active: true
      })
    }
  }, [editingExpense, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Le nom est requis')
      }
      if (!formData.category_id) {
        throw new Error('Veuillez sélectionner une catégorie')
      }
      if (formData.amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0')
      }

      if (editingExpense) {
        await updateRecurringExpense(editingExpense.id, formData)
        onSuccess?.('Dépense récurrente modifiée avec succès')
      } else {
        await addRecurringExpense(formData)
        onSuccess?.('Dépense récurrente ajoutée avec succès')
      }
      
      // Reset form and close
      setFormData({
        name: '',
        amount: 0,
        category_id: '',
        day_of_month: 1,
        is_active: true
      })
      onClose()
      
    } catch (err) {
      console.error('Error saving recurring expense:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = CATEGORIES.find(cat => cat.id === formData.category_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingExpense ? 'Modifier la dépense récurrente' : 'Nouvelle dépense récurrente'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nom de la dépense *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Abonnement Netflix, Loyer..."
              className="w-full"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Montant *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="1"
                min="1"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = value === '' ? 0 : parseInt(value)
                  setFormData({ ...formData, amount: isNaN(numValue) ? 0 : numValue })
                }}
                placeholder="0"
                className="w-full pr-8"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                €
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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

          {/* Day of Month */}
          <div className="space-y-2">
            <Label htmlFor="day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Jour du mois
            </Label>
            <select
              id="day"
              value={formData.day_of_month || 1}
              onChange={(e) => setFormData({ ...formData, day_of_month: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day === 1 ? '1er' : day}ème du mois
                </option>
              ))}
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activer cette dépense récurrente
            </Label>
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
              {loading ? 'Enregistrement...' : editingExpense ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}