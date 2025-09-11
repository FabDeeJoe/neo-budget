import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {}

export interface SignInWithEmailParams {
  email: string
  redirectTo?: string
}

export interface SignInWithPasswordParams {
  email: string
  password: string
}

export interface SignUpParams {
  email: string
  password: string
  redirectTo?: string
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink({ email, redirectTo }: SignInWithEmailParams) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/`,
    },
  })

  return { data, error }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword({ email, password }: SignInWithPasswordParams) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

/**
 * Sign up with email and password
 */
export async function signUp({ email, password, redirectTo }: SignUpParams) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/`,
    },
  })

  return { data, error }
}

// Removed Google OAuth - using email/password only

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (!error) {
    // Force reload to clear any cached data
    window.location.href = '/login'
  }
  
  return { error }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const supabase = createClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting current session:', error)
    return null
  }
  
  return session
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.refreshSession()
  
  return { data, error }
}