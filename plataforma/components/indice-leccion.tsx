import { List } from "lucide-react";
import { extraerEncabezados } from "@/lib/markdown-utils";
import { cn } from "@/lib/utils";

/**
 * Indice de la leccion (tabla de contenidos) generado desde los ## / ### del
 * markdown. variante "movil": desplegable arriba del texto (visible < lg).
 * variante "escritorio": columna lateral pegajosa (visible >= lg).
 * Sin JS: anchors nativos.
 */
export function IndiceLeccion({
  markdown,
  variante,
}: {
  markdown: string;
  variante: "movil" | "escritorio";
}) {
  const encabezados = extraerEncabezados(markdown);
  if (encabezados.length < 2) return null;

  const lista = (
    <ol className="flex flex-col gap-1 text-sm">
      {encabezados.map((e, i) => (
        <li key={`${e.id}-${i}`} className={cn(e.nivel === 3 && "ml-4")}>
          <a
            href={`#${e.id}`}
            className={cn(
              "block rounded px-2 py-1 leading-snug hover:bg-muted hover:text-foreground",
              e.nivel === 2 ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {e.texto}
          </a>
        </li>
      ))}
    </ol>
  );

  if (variante === "movil") {
    return (
      <details className="mb-4 rounded-md border border-border bg-muted/40 lg:hidden">
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold">
          <List className="h-4 w-4 text-primary" /> Indice del tema
        </summary>
        <div className="border-t border-border p-2">{lista}</div>
      </details>
    );
  }

  return (
    <nav
      aria-label="Indice de la leccion"
      className="sticky top-24 hidden max-h-[75vh] w-60 shrink-0 overflow-y-auto rounded-md border border-border bg-card/60 p-3 lg:block"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <List className="h-4 w-4 text-primary" /> Indice
      </div>
      {lista}
    </nav>
  );
}
