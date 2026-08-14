import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
  /** Set false to suppress the focus-visible ring, e.g. inside an already-focused overlay. */
  showFocusRing?: boolean
}

export function Dropdown({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  showFocusRing = true,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(options.findIndex((o) => o.value === value), 0))
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value) ?? options[0]
  const focusRingClass = showFocusRing
    ? 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
    : 'focus-visible:outline-none'

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const option = options[activeIndex]
        if (option) {
          onChange(option.value)
          setOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, activeIndex, options, onChange])

  const toggle = () => {
    setActiveIndex(Math.max(options.findIndex((o) => o.value === value), 0))
    setOpen((o) => !o)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 py-2 pr-2.5 pl-3 text-xs font-medium text-white transition-colors select-none hover:bg-white/10 ${focusRingClass}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown size={14} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full left-0 z-20 mt-2 w-max min-w-full overflow-hidden rounded-lg border border-white/15 bg-[#141414] py-1 shadow-2xl shadow-black/50"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isHighlighted = index === activeIndex || isSelected
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center px-3 py-2 text-left text-xs text-white/90 transition-colors select-none ${focusRingClass} ${
                  isHighlighted ? 'bg-white/10' : ''
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
