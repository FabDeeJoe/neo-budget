'use client'

interface QueueItem {
  id: string
  type: 'expense' | 'budget' | 'recurring_expense'
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
}

class OfflineQueue {
  private queue: QueueItem[] = []
  private isProcessing = false
  private maxRetries = 3
  private retryDelay = 1000 // ms

  constructor() {
    this.loadQueue()
    this.startProcessor()
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Back online, processing queue...')
        this.processQueue()
      })
    }
  }

  add(item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>) {
    const queueItem: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    }
    
    this.queue.push(queueItem)
    this.saveQueue()
    
    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue()
    }
    
    return queueItem.id
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return
    }

    this.isProcessing = true
    
    try {
      const item = this.queue[0]
      
      try {
        await this.processItem(item)
        // Success - remove from queue
        this.queue.shift()
        this.saveQueue()
        
        // Continue with next item
        setTimeout(() => {
          this.isProcessing = false
          this.processQueue()
        }, 100)
        
      } catch (error) {
        console.error('Error processing queue item:', error)
        
        // Increment retry count
        item.retries++
        
        if (item.retries >= this.maxRetries) {
          console.error('Max retries reached, removing item from queue:', item)
          this.queue.shift()
        } else {
          // Retry after delay
          setTimeout(() => {
            this.isProcessing = false
            this.processQueue()
          }, this.retryDelay * item.retries)
          return
        }
        
        this.saveQueue()
        
        // Continue with next item
        setTimeout(() => {
          this.isProcessing = false
          this.processQueue()
        }, 100)
      }
    } catch (error) {
      console.error('Error in queue processing:', error)
      this.isProcessing = false
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    switch (item.type) {
      case 'expense':
        await this.processExpenseItem(supabase, item)
        break
      case 'budget':
        await this.processBudgetItem(supabase, item)
        break
      case 'recurring_expense':
        await this.processRecurringExpenseItem(supabase, item)
        break
      default:
        throw new Error(`Unknown item type: ${item.type}`)
    }
  }

  private async processExpenseItem(supabase: any, item: QueueItem): Promise<void> {
    switch (item.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('expenses')
          .insert([item.data])
        if (createError) throw createError
        break
        
      case 'update':
        const { error: updateError } = await supabase
          .from('expenses')
          .update(item.data.updates)
          .eq('id', item.data.id)
        if (updateError) throw updateError
        break
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', item.data.id)
        if (deleteError) throw deleteError
        break
    }
  }

  private async processBudgetItem(supabase: any, item: QueueItem): Promise<void> {
    switch (item.operation) {
      case 'create':
      case 'update':
        const { error: upsertError } = await supabase
          .from('budgets')
          .upsert([item.data])
        if (upsertError) throw upsertError
        break
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from('budgets')
          .delete()
          .eq('id', item.data.id)
        if (deleteError) throw deleteError
        break
    }
  }

  private async processRecurringExpenseItem(supabase: any, item: QueueItem): Promise<void> {
    switch (item.operation) {
      case 'create':
        const { error: createError } = await supabase
          .from('recurring_expenses')
          .insert([item.data])
        if (createError) throw createError
        break
        
      case 'update':
        const { error: updateError } = await supabase
          .from('recurring_expenses')
          .update(item.data.updates)
          .eq('id', item.data.id)
        if (updateError) throw updateError
        break
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from('recurring_expenses')
          .delete()
          .eq('id', item.data.id)
        if (deleteError) throw deleteError
        break
    }
  }

  private saveQueue() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('budget_tracker_queue', JSON.stringify(this.queue))
      } catch (error) {
        console.error('Error saving queue to localStorage:', error)
      }
    }
  }

  private loadQueue() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('budget_tracker_queue')
        if (saved) {
          this.queue = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading queue from localStorage:', error)
        this.queue = []
      }
    }
  }

  private startProcessor() {
    // Process queue every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.isProcessing) {
        this.processQueue()
      }
    }, 30000)
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getQueueItems(): QueueItem[] {
    return [...this.queue]
  }

  clearQueue(): void {
    this.queue = []
    this.saveQueue()
  }

  isOnline(): boolean {
    return navigator.onLine
  }
}

// Singleton instance
let offlineQueue: OfflineQueue | null = null

export function getOfflineQueue(): OfflineQueue {
  if (!offlineQueue && typeof window !== 'undefined') {
    offlineQueue = new OfflineQueue()
  }
  return offlineQueue as OfflineQueue
}

// React hook for offline queue status
export function useOfflineQueue() {
  const queue = getOfflineQueue()
  
  return {
    queueLength: queue?.getQueueLength() || 0,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    addToQueue: (item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>) => queue?.add(item),
    clearQueue: () => queue?.clearQueue()
  }
}