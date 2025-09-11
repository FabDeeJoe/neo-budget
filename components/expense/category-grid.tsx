'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import { CATEGORIES } from '@/lib/categories'
import { ArrowLeft, Check, Loader2, MoreHorizontal } from 'lucide-react'
import type { Category } from '@/lib/database.types'

interface CategoryGridProps {
  categories: Category[]
  amount: string
  onSelect: (categoryId: string) => void
  onBack: () => void
  loading: boolean
}

export function CategoryGrid({ categories, amount, onSelect, onBack, loading }: CategoryGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const handleCategoryClick = async (categoryId: string) => {
    if (loading) return
    
    setSelectedCategory(categoryId)
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      onSelect(categoryId)
    }, 150)
  }

  const getCategoryStyle = (category: Category) => {
    const categoryConfig = CATEGORIES.find(cat => cat.id === category.slug)
    const isSelected = selectedCategory === category.id
    
    return {
      backgroundColor: isSelected 
        ? categoryConfig?.color || '#10B981'
        : `${categoryConfig?.color || '#10B981'}15`,
      borderColor: categoryConfig?.color || '#10B981',
      color: isSelected 
        ? 'white'
        : categoryConfig?.color || '#10B981'
    }
  }

  // Show either the top 6 favorites or all categories
  const displayCategories = showAllCategories ? CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    slug: cat.id
  } as Category)) : categories.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header with amount */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {formatCurrency(parseFloat(amount))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {showAllCategories ? 'Choisissez une catégorie' : 'Catégories favorites'}
        </p>
      </div>

      {/* Category Grid */}
      <div className={`grid gap-3 ${showAllCategories ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {displayCategories.map((category) => {
          const isSelected = selectedCategory === category.id
          const categoryStyle = getCategoryStyle(category)
          
          return (
            <Button
              key={category.id}
              variant="outline"
              className="h-20 p-4 flex flex-col items-center justify-center space-y-2 touch-action-manipulation transition-all duration-200 hover:scale-105"
              style={categoryStyle}
              onClick={() => handleCategoryClick(category.id)}
              disabled={loading}
            >
              {loading && isSelected ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isSelected ? (
                <Check className="h-6 w-6" />
              ) : (
                <span className="text-2xl">{category.icon}</span>
              )}
              
              <span className="text-xs font-medium text-center leading-tight">
                {category.name.length > 12 
                  ? `${category.name.substring(0, 12)}...` 
                  : category.name
                }
              </span>
            </Button>
          )
        })}

        {/* Show More/Less Button */}
        {!showAllCategories && (
          <Button
            variant="outline"
            className="h-20 p-4 flex flex-col items-center justify-center space-y-2 border-dashed border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowAllCategories(true)}
            disabled={loading}
          >
            <MoreHorizontal className="h-6 w-6 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Voir tout
            </span>
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={showAllCategories ? () => setShowAllCategories(false) : onBack}
          disabled={loading}
          className="flex-1 h-12"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {showAllCategories ? 'Favoris' : 'Montant'}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚡ Sélection automatique - aucune confirmation nécessaire
        </p>
        {!showAllCategories && categories.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Les catégories sont triées par fréquence d'utilisation
          </p>
        )}
      </div>
    </div>
  )
}