'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import type { Budget, InsertBudget, UpdateBudget, Category } from '@/lib/database.types'
import { getCurrentMonth } from '@/lib/date'

export function useBudgets(month?: string) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<(Budget & { category: Category })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const currentMonth = month || getCurrentMonth()
  // Convert YYYY-MM to YYYY-MM-01 for database storage
  const monthAsDate = `${currentMonth}-01`

  useEffect(() => {
    if (user) {
      fetchBudgets()
      
      // Setup real-time subscription
      const channel = supabase
        .channel('budgets_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'budgets',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Budget change received:', payload)
            fetchBudgets()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, currentMonth, supabase])

  const fetchBudgets = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories (*)
        `)
        .eq('user_id', user.id)
        .eq('month', monthAsDate)
        .order('category(display_order)')

      if (error) {
        console.error('Error fetching budgets:', error)
        // Check if it's a table not found error (database not set up)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        const isEmptyError = Object.keys(error).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          // Empty error object likely means tables don't exist or connection issues
          setError('Base de données non configurée. Veuillez créer un projet Supabase et exécuter les migrations.')
        } else {
          setError(errorMessage || 'Erreur lors du chargement des budgets')
        }
      } else {
        setBudgets(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching budgets:', err)
      setError('Failed to fetch budgets')
    } finally {
      setLoading(false)
    }
  }

  const setBudget = async (categorySlug: string, amount: number) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // First, get the category UUID by slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (categoryError || !categoryData) {
        throw new Error(`Category not found: ${categorySlug}`)
      }

      const { data, error } = await supabase
        .from('budgets')
        .upsert([
          {
            user_id: user.id,
            category_id: categoryData.id,
            month: monthAsDate,
            amount
          }
        ], {
          onConflict: 'user_id,category_id,month'
        })
        .select(`
          *,
          category:categories (*)
        `)
        .single()

      if (error) {
        console.error('Error setting budget:', error)
        // Check if it's a table not found error (database not set up)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        const isEmptyError = Object.keys(error).length === 0 || errorMessage === '{}' || !errorMessage || errorMessage === 'null'
        
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          throw new Error('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (isEmptyError) {
          // Empty error object likely means tables don't exist or connection issues
          throw new Error('Base de données non configurée. Veuillez créer un projet Supabase et exécuter les migrations.')
        } else {
          throw new Error(errorMessage || 'Erreur lors de la configuration du budget')
        }
      }

      // Update local state
      setBudgets(prev => {
        const exists = prev.find(b => b.category.slug === categorySlug)
        if (exists) {
          return prev.map(b => b.category.slug === categorySlug ? data : b)
        } else {
          return [...prev, data].sort((a, b) => a.category.display_order - b.category.display_order)
        }
      })

      return data
    } catch (err) {
      console.error('Error setting budget:', err)
      throw err
    }
  }

  const updateBudget = async (id: string, updates: UpdateBudget) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          category:categories (*)
        `)
        .single()

      if (error) {
        console.error('Error updating budget:', error)
        throw new Error(error.message)
      }

      // Update local state
      setBudgets(prev => 
        prev.map(budget => 
          budget.id === id ? data : budget
        )
      )

      return data
    } catch (err) {
      console.error('Error updating budget:', err)
      throw err
    }
  }

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting budget:', error)
        throw new Error(error.message)
      }

      // Update local state
      setBudgets(prev => prev.filter(budget => budget.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting budget:', err)
      throw err
    }
  }

  const copyFromPreviousMonth = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Calculate previous month
      const [year, month] = currentMonth.split('-').map(Number)
      const prevDate = new Date(year, month - 2, 1) // month - 2 because Date months are 0-indexed
      const prevMonth = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}-01`

      // Fetch previous month budgets
      const { data: prevBudgets, error: fetchError } = await supabase
        .from('budgets')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .eq('month', prevMonth)

      if (fetchError) {
        console.error('Error fetching previous budgets:', fetchError)
        throw new Error(fetchError.message)
      }

      if (!prevBudgets || prevBudgets.length === 0) {
        throw new Error('No budgets found for previous month')
      }

      // Insert budgets for current month
      const newBudgets = prevBudgets.map(budget => ({
        user_id: user.id,
        category_id: budget.category_id,
        month: monthAsDate,
        amount: budget.amount
      }))

      const { error: insertError } = await supabase
        .from('budgets')
        .upsert(newBudgets)

      if (insertError) {
        console.error('Error copying budgets:', insertError)
        throw new Error(insertError.message)
      }

      // Refetch budgets
      await fetchBudgets()
      
      return true
    } catch (err) {
      console.error('Error copying from previous month:', err)
      throw err
    }
  }

  const getTotalBudget = () => {
    return budgets.reduce((total, budget) => total + budget.amount, 0)
  }

  const getBudgetByCategory = (categorySlug: string) => {
    return budgets.find(budget => budget.category.slug === categorySlug)
  }

  return {
    budgets,
    loading,
    error,
    setBudget,
    updateBudget,
    deleteBudget,
    copyFromPreviousMonth,
    refetch: fetchBudgets,
    getTotalBudget,
    getBudgetByCategory
  }
}