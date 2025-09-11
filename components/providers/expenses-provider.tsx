'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import type { Expense, InsertExpense, UpdateExpense, Category } from '@/lib/database.types'

interface ExpensesContextType {
  expenses: (Expense & { category: Category })[]
  loading: boolean
  error: string | null
  addExpense: (expenseData: Omit<InsertExpense, 'user_id'>) => Promise<any>
  updateExpense: (id: string, updates: UpdateExpense) => Promise<any>
  deleteExpense: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
  getExpensesByMonth: (month: string) => (Expense & { category: Category })[]
  getMonthlyExpensesByCategory: (categoryId: string, month?: string) => number
  getTotalExpenses: (month?: string) => number
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined)

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<(Expense & { category: Category })[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchRecurringExpenses = useCallback(async () => {
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
  }, [user, supabase])

  const fetchExpenses = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Récupérer toutes les dépenses de l'utilisateur (sans filtre de mois)
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching expenses:', error)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        const isEmptyError = Object.keys(error).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
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
  }, [user, supabase, fetchRecurringExpenses])

  useEffect(() => {
    if (user) {
      fetchExpenses()
      
      // Setup real-time subscription - une seule pour toute l'app
      const channel = supabase
        .channel('expenses_global_changes')
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
  }, [user, fetchExpenses, supabase])

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
      const { data: existing } = await supabase
        .from('favorite_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .single()

      if (existing) {
        await supabase
          .from('favorite_categories')
          .update({
            usage_count: existing.usage_count + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
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
    }
  }

  const getExpensesByMonth = (month: string) => {
    return expenses.filter(expense => {
      const expenseMonth = expense.date.substring(0, 7) // YYYY-MM
      return expenseMonth === month
    })
  }

  const getMonthlyExpensesByCategory = (categoryId: string, month?: string) => {
    let relevantExpenses = expenses
    
    if (month) {
      relevantExpenses = getExpensesByMonth(month)
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

  const getTotalExpenses = (month?: string) => {
    let relevantExpenses = expenses
    
    if (month) {
      relevantExpenses = getExpensesByMonth(month)
    }
    
    // Calculate total from actual expenses
    const expensesTotal = relevantExpenses
      .reduce((total, expense) => total + expense.amount, 0)
    
    // Add all recurring expenses (if they're active)
    const recurringTotal = recurringExpenses
      .filter(recurring => recurring.is_active)
      .reduce((total, recurring) => total + recurring.amount, 0)
    
    return expensesTotal + recurringTotal
  }

  const value: ExpensesContextType = {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
    getExpensesByMonth,
    getMonthlyExpensesByCategory,
    getTotalExpenses
  }

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpensesContext() {
  const context = useContext(ExpensesContext)
  if (context === undefined) {
    throw new Error('useExpensesContext must be used within an ExpensesProvider')
  }
  return context
}