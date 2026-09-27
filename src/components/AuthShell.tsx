import { ReadingHero } from "./Illustrations";
import { LogoMark } from "./Logo";

const FEATURES = [
  ["📚", "Okunan kitapları kolayca kaydet"],
  ["🏆", "Haftanın ve ayın okuru ol"],
  ["🤝", "Öğretmen ve veli hep bir arada"],
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Karşılama alanı */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7b5cff] via-primary to-[#4a2bd6] px-6 pb-16 pt-[max(2rem,env(safe-area-inset-top))] text-white lg:flex lg:flex-col lg:justify-center lg:px-14 lg:pb-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-11 w-11 drop-shadow" />
            <span className="text-2xl font-black tracking-tight">Hep Yanımda</span>
          </div>
          <ReadingHero className="mt-2 w-56 animate-float sm:w-64 lg:mt-8 lg:w-80" />
          <h2 className="mt-2 hidden text-3xl font-black leading-tight lg:block">
            Okuma yolculuğunda
            <br />
            <span className="text-sun">hep yanında.</span>
          </h2>
          <ul className="mt-6 hidden space-y-3 lg:block">
            {FEATURES.map(([i, t]) => (
              <li key={t} className="flex items-center gap-3 font-bold text-white/90">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg">{i}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form alanı */}
      <section className="relative -mt-10 px-4 pb-10 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-md animate-rise">
          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-ink-2">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
