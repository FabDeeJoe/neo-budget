'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import type { FavoriteCategory, Category } from '@/lib/database.types'

export function useFavoriteCategories() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<(FavoriteCategory & { category: Category })[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchFavorites()
      fetchAllCategories()
      
      // Setup real-time subscription for favorites
      const channel = supabase
        .channel('favorites_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite_categories',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Favorite category change received:', payload)
            fetchFavorites()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, supabase])

  const fetchAllCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      if (error) {
        console.error('Error fetching categories:', error)
        // Check if it's a table not found error (database not set up)
        const errorMessage = error.message || error.details || JSON.stringify(error)
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else if (Object.keys(error).length === 0 || !errorMessage) {
          // Empty error object likely means tables don't exist
          setError('Base de données non configurée. Veuillez exécuter les migrations Supabase.')
        } else {
          setError(errorMessage || 'Erreur lors du chargement des catégories')
        }
      } else {
        setAllCategories(data || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to fetch categories')
    }
  }

  const fetchFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('favorite_categories')
        .select(`
          *,
          category:categories (*)
        `)
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .order('last_used', { ascending: false })

      if (error) {
        console.error('Error fetching favorites:', error)
        setError(error.message)
      } else {
        setFavorites(data || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError('Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }

  const getTopFavorites = (count: number = 6) => {
    // Get top favorites by usage_count and last_used
    const topFavorites = favorites
      .slice(0, count)
      .map(fav => fav.category)

    // If we don't have enough favorites, fill with default categories
    if (topFavorites.length < count) {
      const usedCategoryIds = new Set(topFavorites.map(cat => cat.id))
      const remainingCategories = allCategories
        .filter(cat => !usedCategoryIds.has(cat.id))
        .slice(0, count - topFavorites.length)
      
      return [...topFavorites, ...remainingCategories]
    }

    return topFavorites
  }

  const updateFavoritePosition = async (categoryId: string, newPosition: number) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Find the favorite category
      const favorite = favorites.find(fav => fav.category_id === categoryId)
      
      if (favorite) {
        const { error } = await supabase
          .from('favorite_categories')
          .update({ position: newPosition })
          .eq('id', favorite.id)

        if (error) {
          console.error('Error updating favorite position:', error)
          throw new Error(error.message)
        }
      }

      await fetchFavorites()
    } catch (err) {
      console.error('Error updating favorite position:', err)
      throw err
    }
  }

  const getFavoritesByPosition = () => {
    // Get favorites with explicit positions first
    const positioned = favorites
      .filter(fav => fav.position !== null)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(fav => fav.category)

    // Get remaining favorites by usage
    const unpositioned = favorites
      .filter(fav => fav.position === null)
      .sort((a, b) => {
        // Sort by usage_count desc, then by last_used desc
        if (b.usage_count !== a.usage_count) {
          return b.usage_count - a.usage_count
        }
        const aDate = new Date(a.last_used || 0).getTime()
        const bDate = new Date(b.last_used || 0).getTime()
        return bDate - aDate
      })
      .map(fav => fav.category)

    return [...positioned, ...unpositioned]
  }

  const resetFavorites = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('favorite_categories')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error resetting favorites:', error)
        throw new Error(error.message)
      }

      setFavorites([])
    } catch (err) {
      console.error('Error resetting favorites:', err)
      throw err
    }
  }

  return {
    favorites,
    allCategories,
    loading,
    error,
    getTopFavorites,
    getFavoritesByPosition,
    updateFavoritePosition,
    resetFavorites,
    refetch: fetchFavorites
  }
}