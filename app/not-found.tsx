import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-accent">404</p>
        <h1 className="font-display mt-4 text-2xl font-bold text-brand">
          Такой страницы нет
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Возможно, ссылка устарела. Вернитесь на главную — подберём то, что вы
          ищете, за 1 минуту.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
