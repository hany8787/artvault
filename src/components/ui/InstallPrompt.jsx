import { useState, useEffect } from 'react'

/**
 * PWA Install Prompt Banner
 * Affiche une bannière pour installer l'app sur mobile
 * Supporte les modes light et dark
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return // Dismissed less than 7 days ago
    }

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, show banner after a delay if not installed
    if (iOS && !standalone) {
      setTimeout(() => setShowBanner(true), 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showBanner || isStandalone) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white dark:bg-surface-dark border border-neutral-200 dark:border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-accent text-2xl">install_mobile</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Installer ArtVault</h3>
            {isIOS ? (
              <p className="text-sm text-neutral-600 dark:text-white/60">
                Appuyez sur <span className="inline-flex items-center"><span className="material-symbols-outlined text-sm align-middle">ios_share</span></span> puis "Sur l'écran d'accueil"
              </p>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-white/60">
                Ajoutez l'app sur votre écran d'accueil pour un accès rapide
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="text-neutral-400 dark:text-white/40 hover:text-neutral-600 dark:hover:text-white p-1"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Action buttons */}
        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-white/10">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-sm text-neutral-600 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 text-sm bg-accent text-bg-dark font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Installer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
