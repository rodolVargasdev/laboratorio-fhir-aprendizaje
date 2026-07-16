import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { crearGeneradorIds } from "@/lib/markdown-utils";

/** Extrae el texto plano de los children de un heading (para generar el anchor). */
function textoDe(nodo: ReactNode): string {
  if (nodo == null || typeof nodo === "boolean") return "";
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoDe).join("");
  if (typeof nodo === "object" && "props" in nodo) {
    return textoDe((nodo as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** Renderiza markdown (GFM) con estilos de prosa y anchors en ## / ### (para el indice). */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const idDe = crearGeneradorIds();
  return (
    <div className={cn("prosa", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children: c }) => <h2 id={idDe(textoDe(c))}>{c}</h2>,
          h3: ({ children: c }) => <h3 id={idDe(textoDe(c))}>{c}</h3>,
          a: ({ href, children: c }) => (
            <a
              href={href}
              {...(href?.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
