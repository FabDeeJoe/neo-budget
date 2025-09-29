'use client'

import { useState, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, className = '', disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const startYRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const maxPullDistance = 80
  const triggerDistance = 60

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0) return
    startYRef.current = e.touches[0].clientY
  }, [disabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0 || !startYRef.current) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current

    if (diff > 0) {
      e.preventDefault()
      setIsPulling(true)
      const distance = Math.min(diff * 0.5, maxPullDistance)
      setPullDistance(distance)
    }
  }, [disabled, maxPullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isPulling) return

    setIsPulling(false)

    if (pullDistance >= triggerDistance) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
    startYRef.current = 0
  }, [disabled, isPulling, pullDistance, triggerDistance, onRefresh])

  const getOpacity = () => {
    return Math.min(pullDistance / triggerDistance, 1)
  }

  const getRotation = () => {
    if (isRefreshing) return 'animate-spin'
    return pullDistance >= triggerDistance ? 'rotate-180' : `rotate-${Math.min(pullDistance * 3, 180)}`
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="flex justify-center items-center transition-all duration-300 overflow-hidden"
        style={{
          height: isRefreshing ? '60px' : `${Math.max(0, pullDistance)}px`,
          opacity: isRefreshing ? 1 : getOpacity(),
        }}
      >
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <RefreshCw
            className={`h-6 w-6 transition-transform duration-300 ${getRotation()}`}
          />
          <span className="text-xs mt-1 font-medium">
            {isRefreshing
              ? 'Actualisation...'
              : pullDistance >= triggerDistance
                ? 'Relâchez pour actualiser'
                : 'Tirez pour actualiser'
            }
          </span>
        </div>
      </div>

      {/* Content with transform */}
      <div
        className="transition-transform duration-300"
        style={{
          transform: isRefreshing
            ? 'translateY(0)'
            : `translateY(${Math.max(0, pullDistance)}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
}