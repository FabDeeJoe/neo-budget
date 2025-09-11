'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CATEGORIES, getCategoryById } from '@/lib/categories'
import { formatCurrency } from '@/lib/currency'
import { Brain, TrendingUp, TrendingDown, Target, History, Calculator, CheckCircle } from 'lucide-react'
import { getCurrentMonth, getPreviousMonthString } from '@/lib/date'

interface BudgetIntelligenceProps {
  currentBudgets: Array<{
    category_id: string
    amount: number
    category: {
      slug: string
    }
  }>
  historicalExpenses: Array<{
    category_id: string
    category: {
      slug: string
    }
    amount: number
    date: string
  }>
  onApplySuggestion: (categoryId: string, amount: number) => Promise<void>
  disabled?: boolean
}

interface CategoryAnalysis {
  categoryId: string
  name: string
  icon: string
  color: string
  currentBudget: number
  averageSpending: number
  lastMonthSpending: number
  threeMonthAverage: number
  suggestedBudget: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  confidence: 'high' | 'medium' | 'low'
}

export function BudgetIntelligence({ 
  currentBudgets, 
  historicalExpenses, 
  onApplySuggestion,
  disabled 
}: BudgetIntelligenceProps) {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const [isApplying, setIsApplying] = useState(false)

  const analysis = useMemo(() => {
    const currentMonth = getCurrentMonth()
    const previousMonth = getPreviousMonthString(currentMonth)
    
    // Calculate months for 3-month average
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const threeMonthsCutoff = threeMonthsAgo.toISOString().slice(0, 7) // YYYY-MM format

    return CATEGORIES.map(category => {
      const currentBudget = currentBudgets.find(b => b.category.slug === category.id)?.amount || 0
      
      // Filter expenses for this category
      const categoryExpenses = historicalExpenses.filter(e => e.category.slug === category.id)
      
      // Calculate average spending over all available months
      const monthlySpending = new Map<string, number>()
      categoryExpenses.forEach(expense => {
        const monthKey = expense.date.slice(0, 7) // YYYY-MM format
        monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + expense.amount)
      })
      
      const spendingValues = Array.from(monthlySpending.values()).filter(v => v > 0)
      const averageSpending = spendingValues.length > 0 
        ? spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length 
        : 0
      
      // Last month spending
      const lastMonthSpending = monthlySpending.get(previousMonth) || 0
      
      // Three month average
      const recentMonths = Array.from(monthlySpending.entries())
        .filter(([month, _]) => month >= threeMonthsCutoff)
        .map(([_, amount]) => amount)
      const threeMonthAverage = recentMonths.length > 0
        ? recentMonths.reduce((sum, val) => sum + val, 0) / recentMonths.length
        : averageSpending
      
      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable'
      let trendPercentage = 0
      
      if (recentMonths.length >= 2) {
        const oldAverage = recentMonths.slice(0, Math.floor(recentMonths.length / 2))
          .reduce((sum, val) => sum + val, 0) / Math.floor(recentMonths.length / 2)
        const newAverage = recentMonths.slice(Math.floor(recentMonths.length / 2))
          .reduce((sum, val) => sum + val, 0) / Math.ceil(recentMonths.length / 2)
        
        if (oldAverage > 0) {
          trendPercentage = ((newAverage - oldAverage) / oldAverage) * 100
          if (Math.abs(trendPercentage) >= 10) {
            trend = trendPercentage > 0 ? 'up' : 'down'
          }
        }
      }
      
      // Calculate suggested budget
      let suggestedBudget = 0
      if (threeMonthAverage > 0) {
        // Base suggestion on 3-month average with trend adjustment
        suggestedBudget = threeMonthAverage
        
        // Add buffer for upward trend
        if (trend === 'up') {
          suggestedBudget *= 1.15 // 15% buffer
        } else if (trend === 'down') {
          suggestedBudget *= 1.05 // 5% buffer
        } else {
          suggestedBudget *= 1.10 // 10% buffer for stable
        }
      } else if (averageSpending > 0) {
        // Fallback to overall average
        suggestedBudget = averageSpending * 1.20 // 20% buffer
      }
      
      // Round to nearest 10
      suggestedBudget = Math.ceil(suggestedBudget / 10) * 10
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (spendingValues.length >= 6) {
        confidence = 'high'
      } else if (spendingValues.length >= 3) {
        confidence = 'medium'
      }
      
      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        currentBudget,
        averageSpending,
        lastMonthSpending,
        threeMonthAverage,
        suggestedBudget,
        trend,
        trendPercentage,
        confidence
      }
    }).filter(analysis => analysis.averageSpending > 0 || analysis.currentBudget > 0)
      .sort((a, b) => b.suggestedBudget - a.suggestedBudget)
  }, [currentBudgets, historicalExpenses])

  const handleApplySuggestion = async (categoryId: string, suggestedAmount: number) => {
    try {
      setIsApplying(true)
      await onApplySuggestion(categoryId, suggestedAmount)
      setAppliedSuggestions(prev => new Set([...prev, categoryId]))
    } catch (error) {
      console.error('Error applying suggestion:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const handleApplyAllSuggestions = async () => {
    const significantSuggestions = analysis.filter(item => 
      item.suggestedBudget !== item.currentBudget && 
      item.confidence !== 'low' &&
      !appliedSuggestions.has(item.categoryId)
    )
    
    try {
      setIsApplying(true)
      for (const item of significantSuggestions) {
        await onApplySuggestion(item.categoryId, item.suggestedBudget)
        setAppliedSuggestions(prev => new Set([...prev, item.categoryId]))
      }
    } catch (error) {
      console.error('Error applying all suggestions:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const significantChanges = analysis.filter(item => 
    Math.abs(item.suggestedBudget - item.currentBudget) >= 20 &&
    item.confidence !== 'low'
  )

  if (analysis.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-400 dark:text-gray-600 mb-2">
          <Brain className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Intelligence budgétaire
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Pas assez d'historique de dépenses pour générer des suggestions.
          Continuez à utiliser l'application pour obtenir des recommandations personnalisées.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Intelligence budgétaire
          </h3>
        </div>
        
        {significantChanges.length > 0 && (
          <Button
            onClick={handleApplyAllSuggestions}
            disabled={disabled || isApplying}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Target className="h-4 w-4 mr-2" />
            Appliquer les suggestions
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.map((item) => {
          const isApplied = appliedSuggestions.has(item.categoryId)
          const hasSignificantChange = Math.abs(item.suggestedBudget - item.currentBudget) >= 20
          const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Target

          return (
            <div
              key={item.categoryId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant={item.confidence === 'high' ? 'default' : item.confidence === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {item.confidence === 'high' ? 'Fiable' : item.confidence === 'medium' ? 'Moyenne' : 'Incertain'}
                  </Badge>
                  <TrendIcon className={`h-3 w-3 ${
                    item.trend === 'up' ? 'text-red-500' : 
                    item.trend === 'down' ? 'text-green-500' : 
                    'text-gray-400'
                  }`} />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Budget actuel:</span>
                  <span className="font-medium">{formatCurrency(item.currentBudget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Moyenne (3 mois):</span>
                  <span className="font-medium">{formatCurrency(item.threeMonthAverage)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Suggestion:</span>
                  <span className={`font-semibold ${
                    item.suggestedBudget > item.currentBudget ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {formatCurrency(item.suggestedBudget)}
                  </span>
                </div>
              </div>

              {hasSignificantChange && item.confidence !== 'low' && !isApplied && (
                <Button
                  onClick={() => handleApplySuggestion(item.categoryId, item.suggestedBudget)}
                  disabled={disabled || isApplying}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Calculator className="h-3 w-3 mr-1" />
                  Appliquer ({formatCurrency(item.suggestedBudget)})
                </Button>
              )}

              {isApplied && (
                <div className="flex items-center justify-center py-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Appliqué</span>
                </div>
              )}

              {!hasSignificantChange && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Budget optimal ✓
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {significantChanges.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-start">
            <div className="text-2xl mr-3">🧠</div>
            <div>
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                Recommandations basées sur vos habitudes
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                {significantChanges.length} suggestion{significantChanges.length > 1 ? 's' : ''} de budget 
                basé{significantChanges.length > 1 ? 'es' : 'e'} sur votre historique de dépenses des derniers mois.
                Les suggestions incluent une marge de sécurité adaptée à vos tendances.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}