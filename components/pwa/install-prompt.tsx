'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      // Détection basique si l'app est en mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return true
      }

      // Détection pour iOS Safari
      if ((window.navigator as any).standalone) {
        setIsInstalled(true)
        return true
      }

      return false
    }

    // Ne pas afficher le prompt si déjà installé
    if (checkIfInstalled()) {
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le navigateur d'afficher automatiquement le prompt
      e.preventDefault()

      const beforeInstallEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(beforeInstallEvent)

      // Attendre un peu avant d'afficher notre prompt personnalisé
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3 secondes après le chargement
    }

    // Écouter l'installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt()

      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
      } else {
        console.log('PWA installation dismissed')
      }

      // Nettoyer
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    // Ne plus afficher pendant cette session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Ne pas afficher si:
  // - Déjà installé
  // - Pas de prompt disponible
  // - Utilisateur a déjà refusé dans cette session
  if (
    isInstalled ||
    !showPrompt ||
    !deferredPrompt ||
    sessionStorage.getItem('pwa-prompt-dismissed')
  ) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Installer Budget Tracker
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Accédez rapidement à votre budget depuis votre écran d'accueil !
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                Installer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismissPrompt}
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant badge d'installation pour la navigation
export function InstallBadge() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const checkInstallability = () => {
      // Vérifier si installable
      if (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone) {
        setIsInstalled(true)
        return
      }

      // Vérifier si le prompt est disponible
      const handleBeforeInstall = () => setCanInstall(true)
      window.addEventListener('beforeinstallprompt', handleBeforeInstall)

      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }

    checkInstallability()
  }, [])

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
        <Smartphone className="h-3 w-3" />
        Installé
      </div>
    )
  }

  if (!canInstall) return null

  return (
    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
      <Download className="h-3 w-3" />
      Installer app
    </div>
  )
}