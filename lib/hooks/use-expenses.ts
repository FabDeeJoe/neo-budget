'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import type { Expense, InsertExpense, UpdateExpense, Category } from '@/lib/database.types'
import { getCurrentMonth, getMonthBoundsFromString } from '@/lib/date'

export function useExpenses(month?: string) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<(Expense & { category: Category })[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const currentMonth = month || getCurrentMonth()
  const isMonthSpecific = Boolean(month) // Si un mois est spécifié, filtrer par mois

  useEffect(() => {
    if (user) {
      fetchExpenses()
      
      // Setup real-time subscription
      const channel = supabase
        .channel('expenses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Expense change received:', payload)
            fetchExpenses() // Refetch on any change
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, currentMonth, supabase])

  const fetchRecurringExpenses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select(`
          *,
          categories!inner(
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true) // Only active recurring expenses
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRecurringExpenses(data || [])
      }
    } catch (err) {
      console.error('Error fetching recurring expenses:', err)
    }
  }

  const fetchExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories (*),
          recurring_expense:recurring_expenses (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      // Si un mois spécifique est demandé, filtrer par ce mois
      if (isMonthSpecific) {
        const { start: startOfMonth, end: endOfMonth } = getMonthBoundsFromString(currentMonth)
        query = query.gte('date', startOfMonth).lte('date', endOfMonth)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching expenses:', error)
        // Check if it's a table not found error (database not set up)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        const isEmptyError = Object.keys(error).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          // Empty error object likely means tables don't exist or connection issues
          setError('Base de données non configurée. Veuillez créer un projet Supabase et exécuter les migrations.')
        } else {
          setError(errorMessage || 'Erreur lors du chargement des dépenses')
        }
      } else {
        setExpenses(data || [])
        setError(null)
      }
      
      // Also fetch recurring expenses for budget calculations
      await fetchRecurringExpenses()
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const addExpense = async (expenseData: Omit<InsertExpense, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([
          {
            ...expenseData,
            user_id: user.id,
          }
        ])
        .select(`
          *,
          category:categories (*),
          recurring_expense:recurring_expenses (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error('Error adding expense:', error)
        throw new Error(error.message)
      }

      // Optimistic update
      setExpenses(prev => [data, ...prev])
      
      // Update favorite categories usage
      await updateFavoriteCategoryUsage(expenseData.category_id)
      
      return data
    } catch (err) {
      console.error('Error adding expense:', err)
      throw err
    }
  }

  const updateExpense = async (id: string, updates: UpdateExpense) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          category:categories (*),
          recurring_expense:recurring_expenses (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error('Error updating expense:', error)
        throw new Error(error.message)
      }

      // Update local state
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? data : expense
        )
      )

      return data
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const deleteExpense = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting expense:', error)
        throw new Error(error.message)
      }

      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting expense:', err)
      throw err
    }
  }

  const updateFavoriteCategoryUsage = async (categoryId: string) => {
    if (!user) return

    try {
      // Check if favorite category entry exists
      const { data: existing } = await supabase
        .from('favorite_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .single()

      if (existing) {
        // Update existing entry
        await supabase
          .from('favorite_categories')
          .update({
            usage_count: existing.usage_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Create new entry
        await supabase
          .from('favorite_categories')
          .insert([{
            user_id: user.id,
            category_id: categoryId,
            usage_count: 1,
            last_used: new Date().toISOString()
          }])
      }
    } catch (err) {
      console.error('Error updating favorite category usage:', err)
      // Don't throw - this is not critical
    }
  }

  const getTotalExpenses = () => {
    // Calculate total from actual expenses
    const expensesTotal = expenses.reduce((total, expense) => total + expense.amount, 0)
    
    // Add all recurring expenses (if they're active)
    const recurringTotal = recurringExpenses
      .filter(recurring => recurring.is_active)
      .reduce((total, recurring) => total + recurring.amount, 0)
    
    return expensesTotal + recurringTotal
  }

  const getExpensesByCategory = () => {
    const byCategory = expenses.reduce((acc, expense) => {
      const categoryId = expense.category_id
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: expense.category,
          expenses: [],
          total: 0
        }
      }
      acc[categoryId].expenses.push(expense)
      acc[categoryId].total += expense.amount
      return acc
    }, {} as Record<string, { category: Category, expenses: Expense[], total: number }>)

    return Object.values(byCategory)
  }

  const getRecurringExpenses = () => {
    return expenses.filter(expense => expense.is_recurring)
  }

  const getManualExpenses = () => {
    return expenses.filter(expense => !expense.is_recurring)
  }

  const isRecurringExpense = (expense: Expense) => {
    return Boolean(expense.is_recurring && expense.recurring_expense_id)
  }

  const getMonthlyExpensesByCategory = (categoryId: string, monthString?: string) => {
    let relevantExpenses = expenses
    
    // If monthString provided, filter for that specific month
    if (monthString) {
      relevantExpenses = expenses.filter(expense => {
        const expenseMonth = expense.date.substring(0, 7) // YYYY-MM
        return expenseMonth === monthString
      })
    }
    
    // Calculate total from actual expenses
    const expensesTotal = relevantExpenses
      .filter(expense => expense.category_id === categoryId)
      .reduce((total, expense) => total + expense.amount, 0)
    
    // Add recurring expenses for this category (if they're active)
    const recurringTotal = recurringExpenses
      .filter(recurring => recurring.category_id === categoryId && recurring.is_active)
      .reduce((total, recurring) => total + recurring.amount, 0)
    
    return expensesTotal + recurringTotal
  }

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
    getTotalExpenses,
    getExpensesByCategory,
    getRecurringExpenses,
    getManualExpenses,
    isRecurringExpense,
    getMonthlyExpensesByCategory
  }
}