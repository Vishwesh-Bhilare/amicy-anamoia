export default function Spinner({ label = "loading" }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "var(--ink-faint)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--ink-faint)",
          animation: "pt-pulse 1s ease-in-out infinite",
        }}
      />
      {label}…
      <style>{`
        @keyframes pt-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
