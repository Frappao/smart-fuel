import FuelSmartCalculator from "../components/calculation/FuelSmartCalculator";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fuel Smart
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
          Trova il distributore più conveniente considerando prezzo, distanza e
          consumo.
        </p>
      </header>
      <FuelSmartCalculator />
    </main>
  );
}
