import { AppLauncher } from '@capacitor/app-launcher'
import { RIFORNIO_PRIVACY_URL, RIFORNIO_SUPPORT_URL } from './config'

interface MobileFooterProps {
  privacyUrl?: string
  supportUrl?: string
}

export async function openExternalUrl(url: string): Promise<void> {
  try {
    const { completed } = await AppLauncher.openUrl({ url })
    if (completed) return
  } catch {
    // Ignore native launcher errors and fallback to window.open
  }

  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export default function MobileFooter({
  privacyUrl = RIFORNIO_PRIVACY_URL,
  supportUrl = RIFORNIO_SUPPORT_URL,
}: MobileFooterProps) {
  return (
    <footer className="mobile-footer" aria-label="Informazioni e privacy">
      <p className="mobile-footer-text">
        Fai rifornimento dove conviene davvero.
      </p>
      <div className="mobile-footer-links">
        <a
          className="mobile-footer-link"
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault()
            void openExternalUrl(privacyUrl)
          }}
        >
          Informativa sulla Privacy
        </a>
        <span className="mobile-footer-separator" aria-hidden="true">
          •
        </span>
        <a
          className="mobile-footer-link"
          href={supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault()
            void openExternalUrl(supportUrl)
          }}
        >
          Supporto
        </a>
      </div>
    </footer>
  )
}
