'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PieChart, RefreshCw, History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activePattern?: RegExp
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Accueil',
    icon: Home,
    activePattern: /^\/$/
  },
  {
    href: '/settings/budgets',
    label: 'Budgets',
    icon: PieChart,
    activePattern: /^\/settings\/budgets/
  },
  {
    href: '/settings/recurring',
    label: 'Récurrentes',
    icon: RefreshCw,
    activePattern: /^\/settings\/recurring/
  },
  {
    href: '/history',
    label: 'Historique',
    icon: History,
    activePattern: /^\/history/
  }
]

export function BottomNav() {
  const pathname = usePathname()

  // Ne pas afficher la navigation sur la page de login
  if (pathname === '/login') {
    return null
  }

  const isActive = (item: NavItem) => {
    if (item.activePattern) {
      return item.activePattern.test(pathname)
    }
    return pathname === item.href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full px-2 py-2 transition-colors touch-action-manipulation',
                  active
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 mb-1',
                  active ? 'text-green-600 dark:text-green-400' : ''
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  active ? 'text-green-600 dark:text-green-400' : ''
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// Style CSS pour safe area (pour les iPhones avec encoche)
export const bottomNavStyles = `
  .safe-area-pb {
    padding-bottom: env(safe-area-inset-bottom);
  }
`