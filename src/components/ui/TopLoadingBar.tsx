import { useEffect, useState } from 'react'

export function TopLoadingBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setWidth(15)
      const id = setInterval(() => {
        setWidth((w) => (w < 85 ? w + (85 - w) * 0.15 : w))
      }, 200)
      return () => clearInterval(id)
    }

    if (visible) {
      setWidth(100)
      const t = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 250)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-100 h-[3px] bg-transparent" aria-hidden="true">
      <div className="h-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${width}%` }} />
    </div>
  )
}
