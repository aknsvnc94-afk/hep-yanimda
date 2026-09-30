"use client";
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

type AskOptions = {
  title?: string;
  message: React.ReactNode;
  yes?: string;
  no?: string;
  danger?: boolean;
  icon?: string;
};

function Dialog({ o, done }: { o: AskOptions; done: (v: boolean) => void }) {
  const noRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    noRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && done(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div className="absolute inset-0 animate-[fade_.15s_ease-out] bg-black/50 backdrop-blur-[2px]" onClick={() => done(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ask-title"
        className="card relative w-full max-w-sm animate-pop p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
      >
        <div
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-3xl ${o.danger ? "bg-danger-soft" : "bg-primary-soft"}`}
          aria-hidden
        >
          {o.icon ?? (o.danger ? "⚠️" : "❓")}
        </div>
        <h2 id="ask-title" className="mt-3 text-xl font-black text-ink">{o.title ?? "Emin misiniz?"}</h2>
        <div className="mt-1.5 text-sm text-ink-2">{o.message}</div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={noRef} className="btn-outline" onClick={() => done(false)}>{o.no ?? "Hayır"}</button>
          <button
            className={o.danger
              ? "btn bg-danger text-white shadow-[0_4px_0_0_color-mix(in_oklab,var(--color-danger)_60%,black)] hover:brightness-105"
              : "btn-primary"}
            onClick={() => done(true)}
          >
            {o.yes ?? "Evet"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Emin misiniz?" penceresi — Evet: true, Hayır: false döner. */
export function ask(o: AskOptions | string): Promise<boolean> {
  const opts = typeof o === "string" ? { message: o } : o;
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (v: boolean) => {
      resolve(v);
      root.unmount();
      host.remove();
    };
    root.render(<Dialog o={opts} done={done} />);
  });
}
