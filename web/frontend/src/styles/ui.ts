import type { CSSProperties } from "react";

/**
 * Shared style tokens + small style-builder helpers.
 *
 * The app styles everything inline (no CSS modules / Tailwind), which is
 * fine for a small project — but left unchecked it drifts: every button
 * ends up with a slightly different padding, radius, or font-size. These
 * helpers are the single place those values live, so "a button" always
 * looks like a button.
 */

export const radius = 4;

export const font = {
  mono: "var(--font-mono)",
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
};

/** Base look shared by every text input / select / date field in the app. */
export const fieldBase: CSSProperties = {
  fontFamily: font.mono,
  fontSize: 12,
  background: "var(--board-bg)",
  border: "0.5px solid var(--card-border)",
  borderRadius: radius,
  color: "var(--ink)",
  padding: "7px 10px",
  outline: "none",
};

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--pin-active)",
    border: "0.5px solid var(--pin-active)",
    color: "#1c1c1e",
    fontWeight: 600,
  },
  secondary: {
    background: "var(--card-bg)",
    border: "0.5px solid var(--card-border)",
    color: "var(--ink-muted)",
  },
  danger: {
    background: "var(--pin-blocked)",
    border: "0.5px solid var(--pin-blocked)",
    color: "#1c1c1e",
    fontWeight: 600,
  },
  ghost: {
    background: "transparent",
    border: "0.5px dashed var(--card-border)",
    color: "var(--ink-faint)",
  },
};

/** Consistent button styling. Pass a variant, get back all the shared bits. */
export function buttonStyle(variant: ButtonVariant = "secondary", extra?: CSSProperties): CSSProperties {
  return {
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 0.3,
    borderRadius: radius,
    padding: "7px 14px",
    cursor: "pointer",
    transition: "filter 0.15s ease, opacity 0.15s ease, border-color 0.15s ease",
    ...buttonVariants[variant],
    ...extra,
  };
}

export const pinColor: Record<string, string> = {
  active: "var(--pin-active)",
  blocked: "var(--pin-blocked)",
  backlog: "var(--pin-backlog)",
  done: "var(--pin-done)",
};

export const statusLabel: Record<string, string> = {
  active: "Active",
  blocked: "Blocked",
  backlog: "Backlog",
  done: "Done",
};
