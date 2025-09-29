'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { InstallBadge } from '@/components/pwa/install-prompt'
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  user: User
  isOnline: boolean
  queueLength: number
}

export function DashboardHeader({ user, isOnline, queueLength }: DashboardHeaderProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left side - App title and status */}
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Budget Tracker
          </h1>
          
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <Wifi className="h-4 w-4" />
                <span className="sr-only">En ligne</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600 dark:text-orange-400">
                <WifiOff className="h-4 w-4" />
                <span className="sr-only">Hors ligne</span>
              </div>
            )}
            
            {/* Queue indicator */}
            {queueLength > 0 && (
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs">
                <Cloud className="h-4 w-4 mr-1" />
                <span>{queueLength}</span>
                <span className="sr-only">éléments en attente de synchronisation</span>
              </div>
            )}
          </div>

          {/* Install badge */}
          <InstallBadge />
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-3">
          {/* User email - hidden on small screens */}
          <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 truncate max-w-32">
            {user.email}
          </span>
          
          {/* Sign out button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="text-xs dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </header>
  )
}