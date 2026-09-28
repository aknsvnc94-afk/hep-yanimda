/** Sayfa başındaki renkli karşılama bandı */
export function Hero({
  title,
  subtitle,
  right,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7b5cff] via-primary to-[#4a2bd6] p-5 text-white shadow-[0_6px_0_0_var(--color-primary-700)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-accent/40 blur-2xl" />
      <span className="pointer-events-none absolute right-6 top-4 animate-float text-2xl [--r:12deg]" aria-hidden>⭐</span>
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm font-semibold text-white/85">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

export function todayLong() {
  return new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
}
