import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Supporto | Rifornio",
  description:
    "Hai bisogno di aiuto con Rifornio? Consulta le informazioni di supporto o contattaci via email.",
  alternates: {
    canonical: "/supporto",
  },
};

const sectionClassName = "space-y-3";
const headingClassName =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100";

export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        className="text-sm font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
        href="/"
      >
        Torna a Rifornio
      </Link>

      <header className="mt-8 space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Supporto
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Se hai bisogno di aiuto con Rifornio, vuoi segnalare un problema o
          desideri inviarci un suggerimento, puoi contattarci via email.
        </p>
      </header>

      <div className="mt-8 space-y-9 text-base leading-7 text-zinc-700 dark:text-zinc-300">
        <section className={sectionClassName}>
          <h2 className={headingClassName}>Contattaci</h2>
          <p>
            Puoi scriverci all&apos;indirizzo{" "}
            <a
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="mailto:francesco@paolillo.cloud"
            >
              francesco@paolillo.cloud
            </a>
            .
          </p>
          <p>
            Se stai segnalando un problema, descrivi cosa è successo e, se
            possibile, indica il dispositivo e il browser o la versione
            dell&apos;app che stavi utilizzando.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Problemi con il calcolo</h2>
          <p>
            I risultati di Rifornio dipendono dai dati disponibili sui prezzi,
            dalla posizione, dalle distanze stradali e dalle informazioni
            inserite dall&apos;utente.
          </p>
          <p>
            Se un risultato ti sembra anomalo, puoi segnalarcelo indicando il
            tipo di carburante, la modalità Self o Servito e una breve
            descrizione del problema.
          </p>
          <p>
            Non inviare password, dati di pagamento o altre informazioni
            riservate.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Prezzi dei carburanti</h2>
          <p>
            I dati relativi agli impianti e ai prezzi provengono dai dataset
            pubblici del Ministero delle Imprese e del Made in Italy (MIMIT).
          </p>
          <p>
            I prezzi possono essere stati comunicati dai gestori in momenti
            differenti e possono quindi non coincidere sempre con il prezzo
            presente alla pompa nel momento esatto della ricerca.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Privacy</h2>
          <p>
            Per informazioni sul trattamento dei dati e sull&apos;uso della
            posizione consulta la pagina{" "}
            <Link
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-emerald-700 dark:text-zinc-200 dark:hover:text-emerald-300"
              href="/privacy"
            >
              Privacy
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}