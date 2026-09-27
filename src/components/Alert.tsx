export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-red-50 text-red-700 ring-red-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    info: "bg-brand-50 text-brand-700 ring-brand-100",
  }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-3.5 py-2.5 text-sm ring-1 ${styles}`}>{children}</div>;
}
