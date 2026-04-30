import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function InfoPageShell({
  eyebrow,
  title,
  intro,
  children,
  sideTitle = "Qisa kecidler",
  sideItems = [],
}) {
  return (
    <main className="min-h-screen pb-10 text-slate-900 md:pb-12">
      <Navbar showSearch={false} />

      <section className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:px-6 md:pt-6">
        <div className="overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.32)]">
          <div className="relative overflow-hidden px-5 py-8 sm:px-6 md:px-8 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%)]" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-200">
                {intro}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.22)] backdrop-blur md:p-8">
            <div className="space-y-6 text-sm leading-7 text-slate-600">
              {children}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.18)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {sideTitle}
              </p>

              <div className="mt-4 space-y-3">
                {sideItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="press-feedback block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-red-500"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                Elaqe
              </p>
              <h2 className="mt-3 text-2xl font-bold">Komek lazimdir?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Sifaris, geri qaytarma ve ya magaza qaydalari ile bagli sualin varsa bizimle elaqe saxla.
              </p>

              <div className="mt-5 space-y-2 text-sm">
                <a href="tel:+994557380013" className="block font-semibold text-white transition hover:text-red-300">
                  +994 55 738 00 13
                </a>
                <a href="mailto:info@avtopro.az" className="block font-semibold text-white transition hover:text-red-300">
                  info@avtopro.az
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
