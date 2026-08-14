import { Dropdown } from './ui/Dropdown'
import type { Season } from '../types/media'

interface SeasonSelectorProps {
  seasons: Season[]
  selected: number
  onChange: (seasonNumber: number) => void
}

export function SeasonSelector({ seasons, selected, onChange }: SeasonSelectorProps) {
  return (
    <Dropdown
      ariaLabel="Select season"
      value={String(selected)}
      onChange={(v) => onChange(Number(v))}
      options={seasons.map((s) => ({
        value: String(s.seasonNumber),
        label: s.name || `Season ${s.seasonNumber}`,
      }))}
    />
  )
}
