'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out' | 'fade-in-complete'>('fade-in')

  useEffect(() => {
    setTransitionStage('fade-out')

    const timeout = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('fade-in')

      setTimeout(() => {
        setTransitionStage('fade-in-complete')
      }, 150)
    }, 150)

    return () => clearTimeout(timeout)
  }, [pathname, children])

  const getTransitionClass = () => {
    switch (transitionStage) {
      case 'fade-out':
        return 'opacity-0 translate-y-2 transition-all duration-150 ease-in-out'
      case 'fade-in':
        return 'opacity-100 translate-y-0 transition-all duration-150 ease-in-out'
      case 'fade-in-complete':
        return 'opacity-100 translate-y-0'
      default:
        return 'opacity-100 translate-y-0'
    }
  }

  return (
    <div className={getTransitionClass()}>
      {displayChildren}
    </div>
  )
}