export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg-hy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a6bff" />
          <stop offset="1" stopColor="#5b36f2" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lg-hy)" />
      <path d="M10 16.5c4.8-1.8 9.6-1.3 14 1.6v17.4c-4.4-2.9-9.2-3.4-14-1.6z" fill="#fff" />
      <path d="M38 16.5c-4.8-1.8-9.6-1.3-14 1.6v17.4c4.4-2.9 9.2-3.4 14-1.6z" fill="#e4dcff" />
      <path d="M24 9.6c1.3-2 4.2-2 5.2.2.9 1.9-.6 3.5-5.2 6.4-4.6-2.9-6.1-4.5-5.2-6.4 1-2.2 3.9-2.2 5.2-.2z" fill="#ff6b4a" />
      <circle cx="37" cy="10" r="2.2" fill="#ffc233" />
      <circle cx="10" cy="9" r="1.4" fill="#ffc233" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-black tracking-tight text-ink">Hep Yanımda</span>
    </div>
  );
}
