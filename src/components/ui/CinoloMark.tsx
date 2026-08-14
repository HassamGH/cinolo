export function CinoloMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#E50914" />
      <path
        d="M 23.5 12 A 8 8 0 1 0 20 24"
        fill="none"
        stroke="white"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
