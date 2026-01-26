/**
 * Loader Component
 * Elegant spinner with optional message
 */
export default function Loader({ message, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} />
      {message && (
        <p className="text-secondary text-sm mt-4">{message}</p>
      )}
    </div>
  )
}

/**
 * Full Page Loader
 */
export function PageLoader({ message }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-light dark:bg-bg-dark z-50">
      <Loader message={message} size="lg" />
    </div>
  )
}

/**
 * Skeleton Components
 */
export function SkeletonCard() {
  return (
    <div className="animate-in">
      <div className="skeleton aspect-[4/5] rounded-lg mb-3" />
      <div className="skeleton h-5 w-3/4 rounded mb-2" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-in">
          <div className="skeleton w-20 h-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
