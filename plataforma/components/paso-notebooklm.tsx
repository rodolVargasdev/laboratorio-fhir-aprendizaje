"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Copy, Headphones, ExternalLink } from "lucide-react";
import { marcarPaso } from "@/lib/acciones";
import { cn } from "@/lib/utils";

export type FuenteNotebook = { titulo: string; url: string };

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1600);
        } catch {
          // sin permiso de portapapeles: no romper
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
      title={`Copiar ${etiqueta ?? "al portapapeles"}`}
    >
      {copiado ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

export function PasoNotebookLM({
  pasoId,
  temaId,
  temaSlug,
  nombreCuaderno,
  fuentes,
  completado,
  datosIniciales,
}: {
  pasoId: string;
  temaId: string;
  temaSlug: string;
  nombreCuaderno: string;
  fuentes: FuenteNotebook[];
  completado: boolean;
  datosIniciales: { items?: boolean[] } | null;
}) {
  const router = useRouter();

  // Checklist: crear cuaderno, subir paquete, una casilla POR FUENTE, audio, examen oral.
  const nItems = 2 + fuentes.length + 2;
  const base = datosIniciales?.items ?? [];
  const inicial = Array.from({ length: nItems }, (_, i) => base[i] ?? false);
  const [items, setItems] = useState<boolean[]>(completado ? inicial.map(() => true) : inicial);
  const [, startTransition] = useTransition();

  const todos = items.every(Boolean);

  function alternar(i: number) {
    const nuevos = items.map((v, j) => (j === i ? !v : v));
    setItems(nuevos);
    const completo = nuevos.every(Boolean);
    startTransition(async () => {
      await marcarPaso({ pasoId, temaId, temaSlug, completado: completo, datos: { items: nuevos } });
      router.refresh();
    });
  }

  function Item({ indice, children }: { indice: number; children: React.ReactNode }) {
    return (
      <li>
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
            items[indice]
              ? "border-success/40 bg-success-soft/40"
              : "border-border bg-card hover:bg-muted"
          )}
        >
          <span
            className={cn(
              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border",
              items[indice] ? "border-success bg-success text-white" : "border-input"
            )}
          >
            {items[indice] && <Check className="h-3.5 w-3.5" />}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={items[indice]}
            onChange={() => alternar(indice)}
          />
          <span className="min-w-0 flex-1">{children}</span>
        </label>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border-l-4 border-primary bg-primary-soft p-3 text-sm">
        <strong>Paso obligatorio.</strong> Llevar el tema a un cuaderno de NotebookLM
        consolida lo aprendido (audio, examen oral, mapa mental). El tema no se cierra sin
        completar esta lista. Abre{" "}
        <a
          href="https://notebooklm.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          notebooklm.google.com
        </a>{" "}
        en otra pestana y ve marcando.
      </div>

      <ul className="flex flex-col gap-2">
        <Item indice={0}>
          Crear un cuaderno nuevo con este nombre exacto:{" "}
          <span className="font-semibold">{nombreCuaderno}</span>{" "}
          <BotonCopiar texto={nombreCuaderno} etiqueta="el nombre" />
        </Item>

        <Item indice={1}>
          Descargar el paquete del tema y subirlo como fuente (boton{" "}
          <span className="font-semibold">Anadir fuente</span> del cuaderno):
          <a
            href={`/api/tema/${temaSlug}/notebooklm`}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
          >
            <Download className="h-3.5 w-3.5" /> Descargar paquete (.md)
          </a>
        </Item>

        {fuentes.map((f, i) => (
          <Item key={f.url} indice={2 + i}>
            Anadir esta fuente (pega la URL con <span className="font-semibold">Anadir
            fuente -&gt; Sitio web</span>):
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.titulo}</span>
              </a>
              <code className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {f.url}
              </code>
              <BotonCopiar texto={f.url} etiqueta="la URL" />
            </span>
          </Item>
        ))}

        <Item indice={2 + fuentes.length}>
          Generar el <span className="font-semibold">Audio Overview</span> del cuaderno y
          escucharlo completo (ideal en el celular o de camino).
        </Item>

        <Item indice={3 + fuentes.length}>
          Pedirle al cuaderno un <span className="font-semibold">examen oral de 10
          preguntas</span> y responderlo sin mirar las fuentes. Prompt sugerido:{" "}
          <BotonCopiar
            texto="Hazme un examen oral de 10 preguntas sobre este tema, de facil a dificil, sin darme las respuestas hasta que yo intente responder."
            etiqueta="el prompt"
          />
        </Item>
      </ul>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Headphones className="h-4 w-4" /> Cuaderno:{" "}
        <span className="font-semibold text-foreground">{nombreCuaderno}</span>
      </div>

      <div
        className={cn(
          "rounded-md p-3 text-sm font-semibold",
          todos ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
        )}
      >
        {todos
          ? "Paso completado. Ya puedes seguir con el resto del tema."
          : `Te faltan ${items.filter((v) => !v).length} de ${items.length} pasos.`}
      </div>
    </div>
  );
}
