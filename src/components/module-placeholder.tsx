import Link from "next/link";

type ModulePlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
  nextSteps: string[];
};

export function ModulePlaceholder({
  title,
  eyebrow,
  description,
  nextSteps
}: ModulePlaceholderProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-municipal-line bg-white p-5 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-wide text-municipal-action">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-municipal-ink sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-municipal-muted">
          {description}
        </p>
      </section>

      <section className="rounded-lg border border-municipal-line bg-white p-5">
        <h2 className="text-lg font-semibold text-municipal-ink">
          Proximas tareas
        </h2>
        <ul className="mt-4 grid gap-3">
          {nextSteps.map((item) => (
            <li
              key={item}
              className="rounded-md border border-municipal-line bg-municipal-surface px-4 py-3 text-sm text-municipal-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/"
        className="w-fit rounded-md bg-municipal-action px-4 py-2 text-sm font-semibold text-white hover:bg-municipal-actionStrong"
      >
        Volver al centro operativo
      </Link>
    </main>
  );
}
