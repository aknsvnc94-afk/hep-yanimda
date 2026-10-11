"use client";
import { useState } from "react";

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className="input pr-16" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-muted hover:bg-surface-3"
      >
        {show ? "Gizle" : "Göster"}
      </button>
    </div>
  );
}
