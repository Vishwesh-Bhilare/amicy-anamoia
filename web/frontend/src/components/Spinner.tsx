export default function Spinner({ label = "loading" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)" }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: "var(--ink-3)",
        animation: "pt-pulse 1s ease-in-out infinite",
        display: "inline-block",
      }} />
      {label}
    </div>
  );
}
