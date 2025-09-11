'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'
import { ArrowRight, Delete } from 'lucide-react'

interface AmountInputProps {
  onSubmit: (amount: string) => void
  onBack?: () => void
}

export function AmountInput({ onSubmit, onBack }: AmountInputProps) {
  const [amount, setAmount] = useState('')
  const [displayAmount, setDisplayAmount] = useState('0')
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [])

  // Update display when amount changes
  useEffect(() => {
    if (amount === '') {
      setDisplayAmount('0')
    } else {
      const numAmount = parseInt(amount) // Amount is already in euros
      setDisplayAmount(formatCurrency(numAmount).replace('€', '').trim())
    }
  }, [amount])

  const handleNumberClick = (digit: string) => {
    // Prevent amount from getting too large
    if (amount.length >= 8) return
    
    const newAmount = amount + digit
    setAmount(newAmount)
  }

  const handleBackspace = () => {
    if (amount.length > 0) {
      setAmount(amount.slice(0, -1))
    }
  }

  const handleSubmit = () => {
    if (amount === '' || amount === '0') return
    
    const numAmount = parseInt(amount) // Amount is already in euros
    onSubmit(numAmount.toString())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key)
    } else if (e.key === 'Backspace') {
      handleBackspace()
    } else if (e.key === 'Enter' && amount && amount !== '0') {
      handleSubmit()
    }
  }

  const isValidAmount = amount !== '' && amount !== '0'

  return (
    <div 
      ref={containerRef}
      className="space-y-6 focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyPress}
    >
      {/* Amount Display */}
      <div className="text-center py-8">
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {displayAmount} €
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Saisissez le montant de votre dépense
        </p>
      </div>

      {/* Custom Numeric Keyboard */}
      <div className="grid grid-cols-3 gap-3">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            className="h-16 text-xl font-semibold touch-action-manipulation hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleNumberClick(num.toString())}
          >
            {num}
          </Button>
        ))}

        {/* Bottom row: empty, 0, backspace */}
        <div></div>
        <Button
          variant="outline"
          size="lg"
          className="h-16 text-xl font-semibold touch-action-manipulation hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => handleNumberClick('0')}
        >
          0
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-16 touch-action-manipulation hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleBackspace}
          disabled={amount === ''}
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
          >
            Retour
          </Button>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={!isValidAmount}
          className={`h-12 bg-green-600 hover:bg-green-700 text-white font-medium ${
            onBack ? 'flex-1' : 'w-full'
          }`}
        >
          <span>Continuer</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
        💡 Astuce : Utilisez le clavier de votre téléphone ou tapez sur les chiffres
      </p>
    </div>
  )
}