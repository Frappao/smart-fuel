import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import MobileCalculator from './MobileCalculator'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing mobile application root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <MobileCalculator />
  </StrictMode>,
)
