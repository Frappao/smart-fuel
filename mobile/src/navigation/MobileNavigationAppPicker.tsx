import { useId } from 'react'

import {
  NAVIGATION_APP_LABELS,
  type NavigationApp,
} from '../../../lib/navigation/navigationApps'

interface MobileNavigationAppPickerProps {
  app: NavigationApp
  apps: NavigationApp[]
  onChange: (app: NavigationApp) => void
}

/** Scelta dell'app con cui aprire la navigazione verso il distributore. */
export default function MobileNavigationAppPicker({
  app,
  apps,
  onChange,
}: MobileNavigationAppPickerProps) {
  const labelId = useId()

  return (
    <div className="navigation-app-picker">
      <p className="navigation-app-picker-label" id={labelId}>
        Apri con
      </p>
      <div
        aria-labelledby={labelId}
        className="search-mode navigation-app-options"
        role="group"
      >
        {apps.map((option) => (
          <button
            aria-pressed={app === option}
            key={option}
            type="button"
            onClick={() => onChange(option)}
          >
            {NAVIGATION_APP_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
