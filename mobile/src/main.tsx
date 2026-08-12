import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { SUPPORTED_FUEL_TYPE_LABELS } from '../../lib/fuels/supportedFuelTypes'
import { RIFORNIO_API_BASE_URL } from './config'
import './styles.css'

const supportedFuelLabels = Object.values(SUPPORTED_FUEL_TYPE_LABELS).join(', ')

function MobileFoundation() {
  return (
    <main className="mobile-shell">
      <section className="foundation-card">
        <p className="eyebrow">Rifornio Mobile</p>
        <h1>Foundation mobile pronta</h1>
        <p>
          Scaffold tecnico temporaneo per l&apos;app mobile Rifornio.
        </p>
        <dl>
          <div>
            <dt>API</dt>
            <dd>{new URL(RIFORNIO_API_BASE_URL).hostname}</dd>
          </div>
          <div>
            <dt>Carburanti condivisi</dt>
            <dd>{supportedFuelLabels}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing mobile application root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <MobileFoundation />
  </StrictMode>,
)
