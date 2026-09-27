export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="14" fill="#2563eb" />
      <path d="M11 15c4.5-1.6 9-1.2 13 1.6v18c-4-2.8-8.5-3.2-13-1.6z" fill="#fff" />
      <path d="M37 15c-4.5-1.6-9-1.2-13 1.6v18c4-2.8 8.5-3.2 13-1.6z" fill="#dbeafe" />
      <path d="M24 12.2c1.2-1.9 4-1.9 4.9.2.8 1.8-.6 3.3-4.9 6-4.3-2.7-5.7-4.2-4.9-6 .9-2.1 3.7-2.1 4.9-.2z" fill="#fbbf24" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-slate-900">Hep Yanımda</span>
    </div>
  );
}
