import LocationButton from "../components/location/LocationButton";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold">Fuel Smart</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-300">
        Trova il distributore più conveniente considerando prezzo, distanza e
        consumo.
      </p>
      <LocationButton />
    </main>
  );
}
