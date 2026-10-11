export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-danger-soft text-danger-ink ring-danger/30",
    success: "bg-mint-soft text-mint-ink ring-mint/30",
    info: "bg-primary-soft text-primary-ink ring-primary/20",
  }[kind];
  const icon = { error: "⚠️", success: "🎉", info: "💡" }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"}
      className={`flex animate-rise items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${styles}`}>
      <span aria-hidden>{icon}</span>
      <div>{children}</div>
    </div>
  );
}
