'use client'

import { useId } from 'react'

interface Choice<T extends string> {
  value: T
  label: string
  description?: string
}

export default function ChoiceGroup<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string
  value: T
  options: readonly Choice<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  const name = useId()
  return <fieldset disabled={disabled} className="choice-group min-w-0">
    <legend className="mb-2 text-sm font-medium">{label}</legend>
    <div className={options.length > 3 ? "choice-options grid grid-cols-2 gap-2" : "choice-options flex flex-wrap gap-2"}>
      {options.map(option => <label key={option.value} className="choice-option relative min-w-0 flex-1 cursor-pointer select-none active:scale-[0.97] transition-transform duration-100 ease-out">
        <input className="peer sr-only" type="radio" disabled={disabled} aria-label={option.label} name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className="flex min-h-12 h-full flex-col justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center break-words text-sm font-semibold text-zinc-600 transition-all duration-150 hover:border-zinc-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-800 peer-checked:shadow-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600 peer-disabled:cursor-wait peer-disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:peer-checked:border-emerald-400 dark:peer-checked:bg-emerald-950 dark:peer-checked:text-emerald-200">
          {option.label}
          {option.description && <span className="mt-1 text-xs font-normal opacity-80">{option.description}</span>}
        </span>
      </label>)}
    </div>
  </fieldset>
}
