/**
 * Input Component
 * With label, error state, and icon support
 */
export default function Input({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label text-secondary">{label}</label>
      )}
      <div className={icon ? 'input-with-icon' : ''}>
        {icon && (
          <span className="icon material-symbols-outlined text-xl">{icon}</span>
        )}
        <input
          type={type}
          className={`input ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  )
}

/**
 * Textarea Component
 */
export function Textarea({
  label,
  error,
  className = '',
  rows = 4,
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="label text-secondary">{label}</label>
      )}
      <textarea
        rows={rows}
        className={`input textarea ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  )
}
