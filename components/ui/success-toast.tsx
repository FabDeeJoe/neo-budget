'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

interface SuccessToastProps {
  isVisible: boolean
  message: string
  onClose: () => void
  duration?: number
}

export function SuccessToast({ isVisible, message, onClose, duration = 2000 }: SuccessToastProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50])
      }
      
      // Auto close after duration
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    } else {
      // Delay unmount for exit animation
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose, duration])

  if (!shouldRender) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div
        className={`
          flex items-center space-x-3 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg
          transform transition-all duration-300 ease-out pointer-events-auto
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full opacity-0 scale-95'
          }
        `}
      >
        <div className="flex items-center justify-center w-6 h-6 bg-green-700 rounded-full">
          <Check className="h-4 w-4" />
        </div>
        
        <span className="font-medium text-sm">{message}</span>
        
        <button
          onClick={onClose}
          className="p-1 hover:bg-green-700 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}