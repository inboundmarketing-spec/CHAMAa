import type { ReactNode } from 'react';

/** Converte formatação WhatsApp (*negrito*, _itálico_, ~riscado~) para React. */
export function formatWhatsAppText(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => (
    <span key={lineIdx}>
      {lineIdx > 0 && <br />}
      {parseInline(line)}
    </span>
  ));
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    if (m[2] !== undefined) {
      nodes.push(<strong key={key++}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={key++}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(<s key={key++}>{m[4]}</s>);
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length ? nodes : [text];
}
