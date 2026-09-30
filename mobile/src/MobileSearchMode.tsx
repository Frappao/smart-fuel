interface MobileSearchModeProps {
  mode: 'nearby' | 'trip'
  onChange: (mode: 'nearby' | 'trip') => void
}

export default function MobileSearchMode({
  mode,
  onChange,
}: MobileSearchModeProps) {
  return (
    <div className="search-mode" role="group" aria-label="Tipo di ricerca">
      <button
        aria-pressed={mode === 'nearby'}
        type="button"
        onClick={() => onChange('nearby')}
      >
        Vicino a me
      </button>
      <button
        aria-pressed={mode === 'trip'}
        type="button"
        onClick={() => onChange('trip')}
      >
        Lungo un percorso
      </button>
    </div>
  )
}
