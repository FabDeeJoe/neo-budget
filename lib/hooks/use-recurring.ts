'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { RecurringExpenseInput, UpdateRecurringExpenseInput, validateRecurringExpense } from '@/lib/schemas'
import type { Database } from '@/lib/database.types'

type RecurringExpense = Database['public']['Tables']['recurring_expenses']['Row']
type InsertRecurringExpense = Database['public']['Tables']['recurring_expenses']['Insert']
type UpdateRecurringExpense = Database['public']['Tables']['recurring_expenses']['Update']

interface UseRecurringReturn {
  recurringExpenses: RecurringExpense[]
  loading: boolean
  error: string | null
  addRecurringExpense: (data: RecurringExpenseInput) => Promise<void>
  updateRecurringExpense: (id: string, data: UpdateRecurringExpenseInput) => Promise<void>
  deleteRecurringExpense: (id: string) => Promise<void>
  toggleRecurringExpense: (id: string, isActive: boolean) => Promise<void>
  getUpcomingRecurring: (daysAhead?: number) => RecurringExpense[]
  processMonthlyRecurring: (month: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useRecurring(): UseRecurringReturn {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch recurring expenses
  const fetchRecurringExpenses = async () => {
    if (!user) return

    try {
      setError(null)
      const { data, error: fetchError } = await supabase
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
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching recurring expenses:', fetchError)
        
        // Handle missing table gracefully
        const errorMessage = fetchError.message || fetchError.details || JSON.stringify(fetchError)
        const isEmptyError = Object.keys(fetchError).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
          return
        } else if (isEmptyError) {
          setError('Base de données non configurée. Veuillez créer un projet Supabase et exécuter les migrations.')
          return
        }
        
        throw fetchError
      }

      setRecurringExpenses(data || [])
    } catch (err) {
      console.error('Error in fetchRecurringExpenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recurring expenses')
    } finally {
      setLoading(false)
    }
  }

  // Add recurring expense
  const addRecurringExpense = async (expenseData: RecurringExpenseInput) => {
    if (!user) throw new Error('User not authenticated')

    // Validate input
    const validation = validateRecurringExpense(expenseData)
    if (!validation.success) {
      throw new Error(validation.error.issues[0].message)
    }

    try {
      setError(null)
      
      // First, get the category UUID by slug (if category_id looks like a slug)
      let categoryId = expenseData.category_id
      if (expenseData.category_id && !expenseData.category_id.includes('-')) {
        // Looks like a slug, convert to UUID
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', expenseData.category_id)
          .single()

        if (categoryError || !categoryData) {
          throw new Error(`Category not found: ${expenseData.category_id}`)
        }
        
        categoryId = categoryData.id
      }
      
      const { data, error: insertError } = await supabase
        .from('recurring_expenses')
        .insert([{
          ...expenseData,
          category_id: categoryId,
          user_id: user.id,
          day_of_month: expenseData.day_of_month || 1,
          is_active: expenseData.is_active ?? true
        } as InsertRecurringExpense])
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
        .single()

      if (insertError) {
        console.error('Error adding recurring expense:', insertError)
        const errorMessage = insertError.message || insertError.details || JSON.stringify(insertError)
        const isEmptyError = Object.keys(insertError).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          throw new Error('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          throw new Error('Erreur de base de données. Vérifiez que Supabase est correctement configuré.')
        } else {
          throw new Error(errorMessage || 'Erreur lors de l\'ajout de la dépense récurrente')
        }
      }

      if (data) {
        // Optimistic update
        setRecurringExpenses(prev => [data, ...prev])
      }
    } catch (err) {
      console.error('Error in addRecurringExpense:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to add recurring expense')
    }
  }

  // Update recurring expense
  const updateRecurringExpense = async (id: string, updateData: UpdateRecurringExpenseInput) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)

      // Handle category_id conversion from slug to UUID if needed
      let finalUpdateData = { ...updateData }
      if (updateData.category_id && !updateData.category_id.includes('-')) {
        // Looks like a slug, convert to UUID
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', updateData.category_id)
          .single()

        if (categoryError || !categoryData) {
          throw new Error(`Category not found: ${updateData.category_id}`)
        }
        
        finalUpdateData.category_id = categoryData.id
      }

      const { data, error: updateError } = await supabase
        .from('recurring_expenses')
        .update(finalUpdateData as UpdateRecurringExpense)
        .eq('id', id)
        .eq('user_id', user.id)
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
        .single()

      if (updateError) {
        console.error('Error updating recurring expense:', updateError)
        const errorMessage = updateError.message || updateError.details || JSON.stringify(updateError)
        const isEmptyError = Object.keys(updateError).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          throw new Error('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          throw new Error('Erreur de base de données. Vérifiez que Supabase est correctement configuré.')
        } else {
          throw new Error(errorMessage || 'Erreur lors de la modification de la dépense récurrente')
        }
      }

      if (data) {
        // Optimistic update
        setRecurringExpenses(prev => 
          prev.map(expense => expense.id === id ? data : expense)
        )
      }
    } catch (err) {
      console.error('Error in updateRecurringExpense:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to update recurring expense')
    }
  }

  // Delete recurring expense
  const deleteRecurringExpense = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting recurring expense:', deleteError)
        const errorMessage = deleteError.message || deleteError.details || JSON.stringify(deleteError)
        const isEmptyError = Object.keys(deleteError).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          throw new Error('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          throw new Error('Erreur de base de données. Vérifiez que Supabase est correctement configuré.')
        } else {
          throw new Error(errorMessage || 'Erreur lors de la suppression de la dépense récurrente')
        }
      }

      // Optimistic update
      setRecurringExpenses(prev => prev.filter(expense => expense.id !== id))
    } catch (err) {
      console.error('Error in deleteRecurringExpense:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to delete recurring expense')
    }
  }

  // Toggle recurring expense active/inactive
  const toggleRecurringExpense = async (id: string, isActive: boolean) => {
    await updateRecurringExpense(id, { is_active: isActive })
  }

  // Get upcoming recurring expenses
  const getUpcomingRecurring = (daysAhead: number = 30): RecurringExpense[] => {
    const today = new Date()
    const currentDay = today.getDate()
    
    return recurringExpenses
      .filter(expense => expense.is_active)
      .filter(expense => {
        if (!expense.day_of_month) return false
        
        // Simple check: if day_of_month is upcoming this month or next month
        return expense.day_of_month >= currentDay || expense.day_of_month <= daysAhead - 30
      })
      .sort((a, b) => (a.day_of_month || 1) - (b.day_of_month || 1))
  }

  // Process monthly recurring expenses (manual trigger)
  const processMonthlyRecurring = async (month: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setError(null)
      
      // Get active recurring expenses
      const activeRecurring = recurringExpenses.filter(expense => expense.is_active)
      
      if (activeRecurring.length === 0) {
        return
      }

      // For each active recurring expense, create an actual expense entry
      const expensePromises = activeRecurring.map(recurring => {
        const [year, monthNum] = month.split('-')
        const dayOfMonth = Math.min(recurring.day_of_month || 1, new Date(parseInt(year), parseInt(monthNum), 0).getDate())
        const expenseDate = `${year}-${monthNum.padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`
        
        return supabase
          .from('expenses')
          .insert([{
            user_id: user.id,
            category_id: recurring.category_id,
            amount: recurring.amount,
            description: recurring.name,
            date: expenseDate,
            is_recurring: true,
            recurring_expense_id: recurring.id
          }])
      })

      await Promise.all(expensePromises)
      
      console.log(`Processed ${activeRecurring.length} recurring expenses for ${month}`)
    } catch (err) {
      console.error('Error in processMonthlyRecurring:', err)
      throw new Error(err instanceof Error ? err.message : 'Failed to process recurring expenses')
    }
  }

  // Refetch data
  const refetch = async () => {
    setLoading(true)
    await fetchRecurringExpenses()
  }

  // Setup real-time subscription
  useEffect(() => {
    if (!user) {
      setRecurringExpenses([])
      setLoading(false)
      return
    }

    fetchRecurringExpenses()

    // Subscribe to changes
    const channel = supabase
      .channel('recurring_expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_expenses',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch when changes occur
          fetchRecurringExpenses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return {
    recurringExpenses,
    loading,
    error,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    getUpcomingRecurring,
    processMonthlyRecurring,
    refetch
  }
}