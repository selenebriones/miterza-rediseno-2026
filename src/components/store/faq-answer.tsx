import Link from "next/link";
import type { ReactNode } from "react";

// Respuesta de una pregunta frecuente. El texto es plano para que se edite fácil en el panel:
// párrafos separados por una línea en blanco, renglones que empiezan con "- " forman una lista
// y [texto](url) es un enlace (los externos abren en otra pestaña).
export function FaqAnswer({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((line) => line.trim());
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-brand">
              {lines.map((line, j) => (
                <li key={j}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    parts.push(text.slice(last, match.index));
    const className = "font-semibold text-brand underline underline-offset-4 hover:no-underline";
    parts.push(
      href.startsWith("/") ? (
        <Link key={match.index} href={href} className={className}>
          {label}
        </Link>
      ) : /^https?:\/\//.test(href) ? (
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
      ) : (
        label // cualquier otro esquema (javascript:, data:…) se muestra como texto
      ),
    );
    last = match.index + whole.length;
  }
  parts.push(text.slice(last));
  return parts;
}
