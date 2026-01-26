import { useEffect } from 'react'

/**
 * Modal Component
 * Centered overlay with content
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  }

  return (
    <div className="modal-overlay animate-in" onClick={onClose}>
      <div
        className={`modal ${sizeClasses[size]} animate-slide-up`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-default">
            {title && (
              <h2 className="font-display text-xl">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="btn btn-ghost btn-icon"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Drawer Component
 * Slides in from the right
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-default">
          {title && (
            <h2 className="font-display text-xl">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          {children}
        </div>
      </div>
    </>
  )
}

/**
 * Confirm Dialog
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay animate-in" onClick={onClose}>
      <div
        className="modal max-w-sm animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-danger/10' : 'bg-accent/10'
          }`}>
            <span className={`material-symbols-outlined text-2xl ${
              variant === 'danger' ? 'text-danger' : 'text-accent'
            }`}>
              {variant === 'danger' ? 'warning' : 'help'}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-xl mb-2">{title}</h3>

          {/* Message */}
          {message && (
            <p className="text-secondary mb-6">{message}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
