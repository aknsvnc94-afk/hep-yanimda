/** Uygulamaya özel basit çizimler (açık/koyu temada çalışır). */

export function ReadingHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden>
      {/* arka plan daireleri */}
      <circle cx="160" cy="130" r="92" fill="#ffffff" opacity="0.14" />
      <circle cx="160" cy="130" r="64" fill="#ffffff" opacity="0.14" />
      {/* kitap yığını */}
      <rect x="92" y="170" width="136" height="20" rx="5" fill="#ffc233" />
      <rect x="100" y="150" width="120" height="20" rx="5" fill="#14c080" />
      <rect x="86" y="130" width="148" height="20" rx="5" fill="#ff6b4a" />
      <rect x="92" y="175" width="136" height="3" fill="#000" opacity="0.08" />
      <rect x="100" y="155" width="120" height="3" fill="#000" opacity="0.08" />
      <rect x="86" y="135" width="148" height="3" fill="#000" opacity="0.08" />
      {/* açık kitap */}
      <path d="M160 128c-18-12-40-14-60-6V84c20-8 42-6 60 6z" fill="#fff" />
      <path d="M160 128c18-12 40-14 60-6V84c-20-8-42-6-60 6z" fill="#efe9ff" />
      <path d="M112 96h36M112 104h36M112 112h28M172 96h36M172 104h36M172 112h28" stroke="#b9a8ff" strokeWidth="3" strokeLinecap="round" />
      {/* kalp */}
      <path d="M160 62c3-5 10.5-5 13 .5 2.3 4.8-1.5 9-13 16.2-11.5-7.2-15.3-11.4-13-16.2 2.5-5.5 10-5.5 13-.5z" fill="#ff6b4a" />
      {/* yıldızlar */}
      <g fill="#ffc233">
        <path d="M58 58l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" />
        <path d="M262 44l3 6.5 7 .7-5.3 4.6 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.6 7-.7z" />
        <circle cx="272" cy="130" r="4" />
        <circle cx="46" cy="150" r="3" />
      </g>
      <circle cx="240" cy="92" r="6" fill="#fff" opacity="0.7" />
      <circle cx="84" cy="102" r="4" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export function EmptyBooks({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" className="fill-primary-soft" />
      <rect x="26" y="30" width="12" height="40" rx="3" className="fill-accent" />
      <rect x="40" y="24" width="12" height="46" rx="3" className="fill-primary" />
      <rect x="54" y="34" width="12" height="36" rx="3" className="fill-mint" transform="rotate(-10 60 52)" />
      <rect x="22" y="70" width="52" height="5" rx="2.5" className="fill-sun" />
    </svg>
  );
}

export function EmptyPeople({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <circle cx="48" cy="48" r="44" className="fill-sky-soft" />
      <circle cx="36" cy="40" r="10" className="fill-sky" />
      <circle cx="60" cy="40" r="10" className="fill-accent" />
      <path d="M20 72c2-12 10-18 16-18s14 6 16 18z" className="fill-sky" />
      <path d="M44 72c2-12 10-18 16-18s14 6 16 18z" className="fill-accent" />
    </svg>
  );
}

export function Trophy({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M18 10h28v12c0 9-6 16-14 16s-14-7-14-16z" fill="#ffc233" />
      <path d="M18 14H9c0 9 5 14 11 14M46 14h9c0 9-5 14-11 14" fill="none" stroke="#e0a100" strokeWidth="4" strokeLinecap="round" />
      <rect x="28" y="37" width="8" height="10" fill="#e0a100" />
      <rect x="19" y="46" width="26" height="8" rx="3" fill="#ff6b4a" />
      <path d="M26 16l2 4 4 .5-3 2.8.8 4.2L26 25.4 22.2 27.5l.8-4.2-3-2.8 4-.5z" fill="#fff" opacity="0.85" />
    </svg>
  );
}
