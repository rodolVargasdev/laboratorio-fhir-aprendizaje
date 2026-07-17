"use client";

import { Bot } from "lucide-react";

/** Caja sutil que sugiere cuando conviene usar el tutor en este paso.
 *  Al pulsar, abre el tutor flotante (evento que escucha components/tutor-panel.tsx),
 *  opcionalmente con una pregunta precargada. */
export function SugerenciaTutor({
  texto,
  prompt,
  etiqueta = "Abrir el tutor",
}: {
  texto: string;
  prompt?: string;
  etiqueta?: string;
}) {
  function abrir() {
    window.dispatchEvent(
      new CustomEvent("tutor:abrir", { detail: prompt ? { mensaje: prompt } : {} })
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary-soft/40 p-3 text-sm">
      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1">
        <span className="text-muted-foreground">{texto}</span>{" "}
        <button
          type="button"
          onClick={abrir}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          {etiqueta}
        </button>
      </div>
    </div>
  );
}
