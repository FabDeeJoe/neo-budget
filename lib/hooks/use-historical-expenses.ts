'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import type { Expense, Category } from '@/lib/database.types'

export function useHistoricalExpenses(monthsBack: number = 6) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<(Expense & { category: Category })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchHistoricalExpenses()
    }
  }, [user, monthsBack])

  const fetchHistoricalExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - monthsBack)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories (*)
        `)
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching historical expenses:', error)
        // Check if it's a table not found error (database not set up)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        const isEmptyError = Object.keys(error).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          // Empty error object likely means tables don't exist or connection issues
          setError('Base de données non configurée. Veuillez créer un projet Supabase et exécuter les migrations.')
        } else {
          setError(errorMessage || 'Erreur lors du chargement de l\'historique des dépenses')
        }
      } else {
        setExpenses(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching historical expenses:', err)
      setError('Failed to fetch historical expenses')
    } finally {
      setLoading(false)
    }
  }

  const getExpensesByCategory = (categoryId: string) => {
    return expenses.filter(expense => expense.category_id === categoryId)
  }

  const getExpensesByMonth = (monthString: string) => {
    return expenses.filter(expense => expense.date.startsWith(monthString))
  }

  const getTotalByCategory = (categoryId: string) => {
    return expenses
      .filter(expense => expense.category_id === categoryId)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getMonthlyTotalByCategory = (categoryId: string, monthString: string) => {
    return expenses
      .filter(expense => 
        expense.category_id === categoryId && 
        expense.date.startsWith(monthString)
      )
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getMonthlyTotals = () => {
    const monthlyTotals = new Map<string, number>()
    expenses.forEach(expense => {
      const monthKey = expense.date.slice(0, 7) // YYYY-MM format
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount)
    })
    return Object.fromEntries(monthlyTotals)
  }

  const getCategoryMonthlyTotals = (categoryId: string) => {
    const monthlyTotals = new Map<string, number>()
    expenses
      .filter(expense => expense.category_id === categoryId)
      .forEach(expense => {
        const monthKey = expense.date.slice(0, 7) // YYYY-MM format
        monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount)
      })
    return Object.fromEntries(monthlyTotals)
  }

  return {
    expenses,
    loading,
    error,
    getExpensesByCategory,
    getExpensesByMonth,
    getTotalByCategory,
    getMonthlyTotalByCategory,
    getMonthlyTotals,
    getCategoryMonthlyTotals,
    refetch: fetchHistoricalExpenses
  }
}