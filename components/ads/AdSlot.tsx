export default function AdSlot() {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== 'true') {
    return null
  }

  return (
    <aside
      aria-label="Spazio pubblicitario"
      className="flex min-h-24 w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 sm:min-h-28 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
    >
      Spazio pubblicitario
    </aside>
  )
}
