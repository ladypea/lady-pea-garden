import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16">
      <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-glow backdrop-blur">
        <p className="mb-3 text-sm font-bold uppercase tracking-[.3em] text-pink-200">Stream Mini Game</p>
        <h1 className="max-w-3xl text-5xl font-black leading-tight">
          Grow rare flowers in Lady Pea&apos;s chaotic little garden.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pink-50/80">
          Collect seeds, plant mysterious blooms, chase legendary flowers, and let chat become garden goblins.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/garden" className="rounded-full bg-pink-400 px-6 py-3 font-bold text-slate-950">
            Enter Garden
          </Link>
          <Link href="/leaderboard" className="rounded-full border border-white/20 px-6 py-3 font-bold">
            View Leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}
