const COLORS = ["#6c47ff", "#ff6b4a", "#ffc233", "#14c080", "#2fa8ff", "#ff5fa2"];

/** Ekrana kısa bir konfeti yağmuru bırakır. */
export function confetti(count = 70) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const frag = document.createDocumentFragment();
  const pieces: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = COLORS[i % COLORS.length];
    el.style.setProperty("--dx", `${(Math.random() - 0.5) * 200}px`);
    el.style.setProperty("--rot", `${(Math.random() - 0.5) * 1440}deg`);
    el.style.setProperty("--dur", `${1.6 + Math.random() * 1.4}s`);
    el.style.animationDelay = `${Math.random() * 0.25}s`;
    if (i % 3 === 0) el.style.borderRadius = "50%";
    pieces.push(el);
    frag.appendChild(el);
  }
  document.body.appendChild(frag);
  setTimeout(() => pieces.forEach((p) => p.remove()), 3500);
}
