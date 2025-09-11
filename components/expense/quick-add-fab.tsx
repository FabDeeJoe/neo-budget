'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { QuickExpenseModal } from './quick-expense-modal'

export function QuickAddFAB() {
  const [isPressed, setIsPressed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <Button
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={`
          fixed bottom-6 right-6 z-50 
          w-16 h-16 rounded-full 
          bg-green-600 hover:bg-green-700 active:bg-green-800
          shadow-lg hover:shadow-xl 
          transition-all duration-200 
          flex items-center justify-center
          touch-action-manipulation
          ${isPressed ? 'scale-95' : 'scale-100 hover:scale-105'}
        `}
      >
        <Plus className="h-7 w-7 text-white" />
        <span className="sr-only">Ajouter une dépense rapide</span>
      </Button>

      <QuickExpenseModal
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  )
}