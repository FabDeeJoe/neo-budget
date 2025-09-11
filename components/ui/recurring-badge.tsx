'use client'

import { Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecurringBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export function RecurringBadge({ size = 'sm', className, showText = false }: RecurringBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full px-2 py-1',
        sizeClasses[size],
        className
      )}
      title="Dépense récurrente"
    >
      <Repeat className={cn('text-blue-600 dark:text-blue-400', iconSizeClasses[size])} />
      {showText && (
        <span className={cn('font-medium whitespace-nowrap', textSizeClasses[size])}>
          Récurrente
        </span>
      )}
    </div>
  )
}