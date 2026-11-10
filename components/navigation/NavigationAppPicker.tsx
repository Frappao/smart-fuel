'use client'

import { useId } from 'react'

import {
  NAVIGATION_APPS,
  NAVIGATION_APP_LABELS,
} from '../../lib/navigation/navigationApps'
import { setNavigationApp, useNavigationApp } from './useNavigationApp'

/** Scelta dell'app con cui aprire la navigazione, ricordata nel browser. */
export default function NavigationAppPicker({
  className = '',
}: {
  className?: string
}) {
  const selectedApp = useNavigationApp()
  const groupName = useId()

  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="mb-1.5 text-[11px] font-medium text-zinc-400">
        Apri con
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1">
        {NAVIGATION_APPS.map((app) => (
          <label
            className="relative flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-1 text-center text-xs font-semibold text-zinc-400 transition-colors select-none hover:text-zinc-100 has-checked:bg-zinc-800 has-checked:text-zinc-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-emerald-400"
            key={app}
          >
            <input
              checked={selectedApp === app}
              className="sr-only"
              name={groupName}
              onChange={() => setNavigationApp(app)}
              type="radio"
              value={app}
            />
            {NAVIGATION_APP_LABELS[app]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
