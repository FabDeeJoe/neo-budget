'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDisplay, getPreviousMonthString, getNextMonthString } from '@/lib/date'

interface MonthSelectorProps {
  currentMonth: string
  onMonthChange: (month: string) => void
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {
  // Safely create date from month string
  const createDateFromMonth = (monthString: string): Date => {
    const [year, month] = monthString.split('-').map(Number)
    if (!year || !month || month < 1 || month > 12) {
      return new Date() // Fallback to current date
    }
    return new Date(year, month - 1, 1)
  }
  
  const currentDate = createDateFromMonth(currentMonth)
  const displayMonth = getMonthDisplay(currentDate)
  
  const goToPrevious = () => {
    const prevMonthString = getPreviousMonthString(currentMonth)
    onMonthChange(prevMonthString)
  }
  
  const goToNext = () => {
    const nextMonthString = getNextMonthString(currentMonth)
    onMonthChange(nextMonthString)
  }
  
  const goToCurrent = () => {
    const currentMonthString = new Date().toISOString().slice(0, 7) // YYYY-MM format
    onMonthChange(currentMonthString)
  }
  
  const isCurrentMonth = () => {
    const now = new Date()
    const currentMonthString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    return currentMonth === currentMonthString
  }

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPrevious}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="sr-only">Mois précédent</span>
      </Button>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
          {displayMonth}
        </h2>
        {!isCurrentMonth() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrent}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 h-auto"
          >
            Revenir au mois actuel
          </Button>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNext}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronRight className="h-5 w-5" />
        <span className="sr-only">Mois suivant</span>
      </Button>
    </div>
  )
}