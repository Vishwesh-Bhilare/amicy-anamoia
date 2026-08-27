import React from "react";

/**
 * Tiny inline-markdown renderer: **bold**, `code`, [text](url), and
 * line breaks. Deliberately not a full markdown lib — log entries are
 * short, and this avoids adding a dependency for a handful of tags.
 */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    nodes.push(<React.Fragment key={`l${i}`}>{renderLine(line, i)}</React.Fragment>);
    if (i < lines.length - 1) nodes.push(<br key={`br${i}`} />);
  });
  return nodes;
}

const codeStyle: React.CSSProperties = {
  background: "var(--board-bg)",
  border: "0.5px solid var(--card-border)",
  borderRadius: 3,
  padding: "1px 5px",
  fontFamily: "var(--font-mono)",
  fontSize: "0.9em",
};

const linkStyle: React.CSSProperties = {
  color: "var(--pin-active)",
  textDecoration: "underline",
};

function renderLine(line: string, lineIndex: number): React.ReactNode[] {
  const tokenRegex = /(\*\*.+?\*\*|`.+?`|\[.+?\]\(.+?\))/g;
  const parts = line.split(tokenRegex).filter((p) => p !== "");

  return parts.map((part, i) => {
    const key = `${lineIndex}-${i}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return React.createElement("strong", { key }, inner);
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      return React.createElement("code", { key, style: codeStyle }, inner);
    }

    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      return React.createElement(
        "a",
        { key, href: url, target: "_blank", rel: "noreferrer", style: linkStyle },
        label
      );
    }

    return React.createElement(React.Fragment, { key }, part);
  });
}
