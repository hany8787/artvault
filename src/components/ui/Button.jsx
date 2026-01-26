/**
 * Button Component
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const baseClasses = 'btn'

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="spinner w-4 h-4" />
      ) : (
        <>
          {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
          {children}
          {iconRight && <span className="material-symbols-outlined text-lg">{iconRight}</span>}
        </>
      )}
    </button>
  )
}
