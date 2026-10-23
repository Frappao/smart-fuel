'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

type AppPlatform = 'android' | 'ios'

const DISMISSED_STORAGE_KEY = 'rifornio_app_promo_dismissed_v1'

interface AppBetaModalContextValue {
  openAppModal: (platform?: AppPlatform) => void
}

const AppBetaModalContext = createContext<AppBetaModalContextValue | null>(null)

export function useAppBetaModal() {
  return useContext(AppBetaModalContext)
}

export function AppBetaButton() {
  const modal = useAppBetaModal()
  if (!modal) return null

  return (
    <button
      type="button"
      onClick={() => modal.openAppModal()}
      aria-haspopup="dialog"
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:px-3.5 sm:text-sm dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200 dark:hover:bg-emerald-400/20"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span>App</span>
      <span className="hidden rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase md:inline-block dark:bg-emerald-400 dark:text-emerald-950">
        Beta
      </span>
    </button>
  )
}

export function AppBetaProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [platform, setPlatform] = useState<AppPlatform>('android')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedPlatform, setSubmittedPlatform] =
    useState<AppPlatform | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const openAppModal = useCallback((initialPlatform?: AppPlatform) => {
    if (initialPlatform) {
      setPlatform(initialPlatform)
    } else if (
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ) {
      setPlatform('ios')
    }
    setErrorMessage(null)
    setIsOpen(true)
  }, [])

  const closeAppModal = useCallback(() => {
    setIsOpen(false)
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, '1')
    } catch {
      // Ignore storage errors in private mode
    }
  }, [])

  useEffect(() => {
    // Auto-show once in real browser sessions after 2.2 seconds if not yet dismissed
    if (typeof window === 'undefined') return
    try {
      if (window.localStorage.getItem(DISMISSED_STORAGE_KEY) === '1') {
        return
      }
    } catch {
      return
    }

    const timer = window.setTimeout(() => {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setPlatform('ios')
      }
      setIsOpen(true)
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage('Inserisci la tua email per continuare.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/app-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          platform,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(
          payload?.error ?? 'Non riesco a registrare la richiesta ora.',
        )
      }

      setSubmittedPlatform(platform)
      setEmail('')
      try {
        window.localStorage.setItem(DISMISSED_STORAGE_KEY, '1')
      } catch {
        // Ignore storage errors
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Errore imprevisto. Riprova tra qualche istante.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const contextValue = useMemo(
    () => ({ openAppModal }),
    [openAppModal],
  )

  return (
    <AppBetaModalContext.Provider value={contextValue}>
      {children}

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-beta-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAppModal()
          }}
        >
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            {/* Top Gradient Header */}
            <div className="relative bg-gradient-to-br from-zinc-900 via-emerald-950 to-emerald-900 px-6 pt-5 pb-6 text-white">
              {/* Segmented Platform Switch + Close Button */}
              <div className="flex items-center justify-between gap-2">
                <div
                  role="tablist"
                  aria-label="Scegli il tuo telefono"
                  className="grid flex-1 grid-cols-2 rounded-full bg-white/10 p-1 backdrop-blur-md"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={platform === 'android'}
                    onClick={() => {
                      setPlatform('android')
                      setErrorMessage(null)
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                      platform === 'android'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.523 15.341a.96.96 0 0 1-.96-.96.96.96 0 0 1 .96-.96.96.96 0 0 1 .96.96.96.96 0 0 1-.96.96m-11.046 0a.96.96 0 0 1-.96-.96.96.96 0 0 1 .96-.96.96.96 0 0 1 .96.96.96.96 0 0 1-.96.96m11.4-5.774 1.915-3.318a.4.4 0 0 0-.146-.546.4.4 0 0 0-.546.146l-1.94 3.36A11.45 11.45 0 0 0 12 8.14a11.45 11.45 0 0 0-5.16 1.069l-1.94-3.36a.4.4 0 0 0-.546-.146.4.4 0 0 0-.146.546L6.123 9.567C2.86 11.34.66 14.68.38 18.6h23.24c-.28-3.92-2.48-7.26-5.743-9.033" />
                    </svg>
                    <span>Ho un Android</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={platform === 'ios'}
                    onClick={() => {
                      setPlatform('ios')
                      setErrorMessage(null)
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                      platform === 'ios'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.87 6.33c.65-.78 1.08-1.86.96-2.95-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.51 2.72-1.29" />
                    </svg>
                    <span>Ho un iPhone</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeAppModal}
                  aria-label="Chiudi annuncio app"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="m6 6 12 12M6 18 18 6" />
                  </svg>
                </button>
              </div>

              {/* Status Badge + Title */}
              <div className="mt-5">
                {platform === 'android' ? (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      Novità · In prova su Google Play
                    </span>
                    <h2
                      id="app-beta-modal-title"
                      className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                      È arrivata l&apos;app Android
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-200">
                      Rifornio è pronta per i primi tester. Provala in anteprima
                      sul tuo telefono.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-200 uppercase">
                      🍎 In arrivo · Prossimamente
                    </span>
                    <h2
                      id="app-beta-modal-title"
                      className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                      Sta arrivando l&apos;app per iPhone
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-200">
                      Stiamo preparando la versione iOS. Lasciaci la tua email e
                      ti avvisiamo appena è pronta.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 p-6">
              {platform === 'android' ? (
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Mappa e classifica a litri netti
                      </p>
                      <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        Vedi subito quanto risparmi davvero considerando prezzo,
                        distanza stradale e consumo.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="6" cy="19" r="3" />
                        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                        <circle cx="18" cy="5" r="3" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Modalità &quot;Lungo un percorso&quot;
                      </p>
                      <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        Inserisci partenza e destinazione: ti diciamo dove
                        fermarti con la minima deviazione.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Avvio rapido nel navigatore
                      </p>
                      <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        Un tocco sul distributore più conveniente e apri subito
                        Google Maps.
                      </p>
                    </div>
                  </li>
                </ul>
              ) : null}

              {/* Callout + Email Form */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-800/60 dark:bg-amber-950/25">
                {submittedPlatform === platform ? (
                  <div className="space-y-1.5 py-2 text-center">
                    <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                      🎉 Richiesta ricevuta!
                    </p>
                    <p className="text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                      {platform === 'android'
                        ? 'Ti abbiamo aggiunto alla lista tester Android. Riceverai via email il link ufficiale di Google Play per scaricare Rifornio.'
                        : "Ti avviseremo con un'email non appena la versione per iPhone sarà pronta da scaricare."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {platform === 'android'
                          ? 'Vuoi provarla in anteprima?'
                          : 'Vuoi essere tra i primi su iPhone?'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-700 dark:text-zinc-300">
                        {platform === 'android' ? (
                          <>
                            Google Play richiede una breve fase di test su
                            invito prima del rilascio pubblico. Inserisci
                            l&apos;email del tuo account{' '}
                            <strong>Google Play</strong> (di solito{' '}
                            <code className="font-semibold">@gmail.com</code>) e
                            ti abilitiamo al download.
                          </>
                        ) : (
                          <>
                            Inserisci la tua email: ti manderemo un solo
                            messaggio non appena l&apos;app iOS sarà disponibile.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          platform === 'android'
                            ? 'nome@gmail.com'
                            : 'nome@icloud.com'
                        }
                        aria-label={
                          platform === 'android'
                            ? 'Email del tuo account Google Play'
                            : 'La tua email per avviso iPhone'
                        }
                        className="min-h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-h-11 shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                      >
                        {isSubmitting ? 'Invio…' : 'Voglio provarla'}
                      </button>
                    </div>

                    {errorMessage ? (
                      <p
                        role="alert"
                        className="text-xs font-medium text-red-700 dark:text-red-300"
                      >
                        {errorMessage}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>

              <div className="space-y-2 text-center">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Useremo l&apos;email solo per l&apos;invito all&apos;app. Zero
                  spam.
                </p>
                <button
                  type="button"
                  onClick={closeAppModal}
                  className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Più tardi
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppBetaModalContext.Provider>
  )
}
