import { Link } from 'react-router-dom'

/**
 * Empty State Component
 * Displays when there's no content
 */
export default function EmptyState({
  icon = 'inventory_2',
  title,
  description,
  action,
  actionLink,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-secondary">
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-2xl mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-secondary max-w-sm mb-6">{description}</p>
      )}

      {/* Action */}
      {action && (
        actionLink ? (
          <Link to={actionLink} className="btn btn-primary">
            {action}
          </Link>
        ) : onAction ? (
          <button onClick={onAction} className="btn btn-primary">
            {action}
          </button>
        ) : null
      )}
    </div>
  )
}

/**
 * Error State Component
 */
export function ErrorState({
  title = 'Une erreur est survenue',
  description,
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-danger">
          error
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-2xl mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-secondary max-w-sm mb-6">{description}</p>
      )}

      {/* Retry button */}
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline">
          <span className="material-symbols-outlined">refresh</span>
          Réessayer
        </button>
      )}
    </div>
  )
}
