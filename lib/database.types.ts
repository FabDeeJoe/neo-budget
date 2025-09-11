export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          icon: string
          color: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          icon: string
          color: string
          display_order: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          icon?: string
          color?: string
          display_order?: number
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          amount: number
          day_of_month: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          amount: number
          day_of_month?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          amount?: number
          day_of_month?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          description: string | null
          date: string
          is_recurring: boolean
          recurring_expense_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          description?: string | null
          date?: string
          is_recurring?: boolean
          recurring_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorite_categories: {
        Row: {
          id: string
          user_id: string
          category_id: string
          usage_count: number
          last_used: string | null
          position: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          usage_count?: number
          last_used?: string | null
          position?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          usage_count?: number
          last_used?: string | null
          position?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Category = Database['public']['Tables']['categories']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type RecurringExpense = Database['public']['Tables']['recurring_expenses']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type FavoriteCategory = Database['public']['Tables']['favorite_categories']['Row']

export type InsertBudget = Database['public']['Tables']['budgets']['Insert']
export type UpdateBudget = Database['public']['Tables']['budgets']['Update']

export type InsertExpense = Database['public']['Tables']['expenses']['Insert']
export type UpdateExpense = Database['public']['Tables']['expenses']['Update']

export type InsertRecurringExpense = Database['public']['Tables']['recurring_expenses']['Insert']
export type UpdateRecurringExpense = Database['public']['Tables']['recurring_expenses']['Update']