"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Headphones, ExternalLink } from "lucide-react";
import { marcarPaso } from "@/lib/acciones";
import { cn } from "@/lib/utils";

const ITEMS = [
  "Crear un cuaderno nuevo en NotebookLM con el nombre sugerido.",
  "Descargar el paquete del tema y subirlo como fuente.",
  "Anadir 2 a 4 enlaces oficiales del tema como fuentes.",
  "Generar el Audio Overview y escucharlo una vez.",
  "Hacer el examen oral de 10 preguntas y responderlo sin mirar.",
];

export function PasoNotebookLM({
  pasoId,
  temaId,
  temaSlug,
  nombreCuaderno,
  completado,
  datosIniciales,
}: {
  pasoId: string;
  temaId: string;
  temaSlug: string;
  nombreCuaderno: string;
  completado: boolean;
  datosIniciales: { items?: boolean[] } | null;
}) {
  const router = useRouter();
  const inicial =
    datosIniciales?.items && datosIniciales.items.length === ITEMS.length
      ? datosIniciales.items
      : ITEMS.map(() => false);
  const [items, setItems] = useState<boolean[]>(inicial);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border-l-4 border-primary bg-primary-soft p-3 text-sm">
        <strong>Paso obligatorio.</strong> Llevar el tema a un cuaderno de NotebookLM
        consolida lo aprendido (audio, preguntas y mapa mental). El tema no se cierra sin
        completar esta lista.
      </div>

      <a
        href={`/api/tema/${temaSlug}/notebooklm`}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
      >
        <Download className="h-4 w-4" /> Descargar paquete del tema (.md)
      </a>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Headphones className="h-4 w-4" /> Cuaderno sugerido:{" "}
        <span className="font-semibold text-foreground">{nombreCuaderno}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {ITEMS.map((label, i) => (
          <li key={i}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                items[i] ? "border-success/40 bg-success-soft/40" : "border-border bg-card hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border",
                  items[i] ? "border-success bg-success text-white" : "border-input"
                )}
              >
                {items[i] && <Check className="h-3.5 w-3.5" />}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={items[i]}
                onChange={() => alternar(i)}
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>

      <a
        href="https://notebooklm.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Abrir NotebookLM
      </a>

      <div
        className={cn(
          "rounded-md p-3 text-sm font-semibold",
          todos ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
        )}
      >
        {todos
          ? "Paso completado. Ya puedes seguir con el resto del tema."
          : `Te faltan ${items.filter((v) => !v).length} de ${ITEMS.length} pasos.`}
      </div>
    </div>
  );
}
