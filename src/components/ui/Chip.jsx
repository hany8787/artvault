/**
 * Chip Component
 * For filters and tags
 */
export default function Chip({
  children,
  active = false,
  onClick,
  removable = false,
  onRemove,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? 'active' : ''} ${className}`}
    >
      {children}
      {removable && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="material-symbols-outlined text-sm ml-1 hover:text-danger"
        >
          close
        </span>
      )}
    </button>
  )
}

/**
 * Chip Group Component
 * For selecting multiple options
 */
export function ChipGroup({
  options,
  selected = [],
  onChange,
  multiple = false,
  className = '',
}) {
  const handleClick = (value) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter(v => v !== value))
      } else {
        onChange([...selected, value])
      }
    } else {
      onChange(selected.includes(value) ? [] : [value])
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <Chip
          key={option.value}
          active={selected.includes(option.value)}
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  )
}
