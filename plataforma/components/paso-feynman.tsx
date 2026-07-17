"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Lightbulb, Send, Sparkles } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { enviarRetoFeynman } from "@/lib/acciones";

export type EvaluacionFeynmanVista = {
  puntaje: number;
  veredicto: string;
  fortalezas: string[];
  brechas: string[];
  sugerencias: string | null;
  aprobado: boolean;
};

export function PasoFeynman({
  temaId,
  temaSlug,
  temaNombre,
  objetivos,
  umbral,
  intentoPrevio,
}: {
  temaId: string;
  temaSlug: string;
  temaNombre: string;
  objetivos: string[];
  umbral: number;
  intentoPrevio: {
    explicacion: string;
    puntaje: number;
    veredicto: string;
    fortalezas: string[];
    brechas: string[];
    sugerencias: string | null;
    aprobado: boolean;
  } | null;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(intentoPrevio?.explicacion ?? "");
  const [evaluacion, setEvaluacion] = useState<EvaluacionFeynmanVista | null>(
    intentoPrevio
      ? {
          puntaje: intentoPrevio.puntaje,
          veredicto: intentoPrevio.veredicto,
          fortalezas: intentoPrevio.fortalezas,
          brechas: intentoPrevio.brechas,
          sugerencias: intentoPrevio.sugerencias,
          aprobado: intentoPrevio.aprobado,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const aprobado = evaluacion?.aprobado ?? false;

  function enviar() {
    setError(null);
    startTransition(async () => {
      const res = await enviarRetoFeynman(temaId, temaSlug, texto);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEvaluacion({ ...res.evaluacion, aprobado: res.aprobado });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Instrucciones: cuando y como se hace el reto */}
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <Lightbulb className="h-4 w-4 text-primary" /> En que consiste
        </div>
        <p className="text-muted-foreground">
          Este es el momento de comprobar que de verdad entendiste{" "}
          <span className="font-semibold text-foreground">{temaNombre}</span>. Explicalo con tus
          propias palabras, como si se lo ensenaras a un colega sin base tecnica. Evita copiar la
          leccion: usa ejemplos tuyos. El tutor lo revisara y te dira que dominas y que te falta.
        </p>
        {objetivos.length > 0 && (
          <>
            <p className="mt-3 font-semibold text-foreground">Procura cubrir:</p>
            <ul className="ml-5 mt-1 list-disc text-muted-foreground">
              {objetivos.slice(0, 5).map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="feynman" className="text-sm font-semibold">
          Tu explicacion
        </label>
        <textarea
          id="feynman"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={9}
          placeholder="Empieza aqui. Explica el tema paso a paso, con tus palabras y un ejemplo propio..."
          className="min-h-40 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{texto.trim().length} caracteres</span>
          <span>Se aprueba con {umbral}/100 o mas.</span>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-danger-soft/50 p-3 text-sm text-danger">
          <CircleAlert className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div>
        <Boton onClick={enviar} disabled={pendiente || texto.trim().length === 0} tamano="sm">
          {pendiente ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" /> Evaluando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> {evaluacion ? "Reintentar" : "Enviar al tutor"}
            </>
          )}
        </Boton>
      </div>

      {evaluacion && <ResultadoFeynman evaluacion={evaluacion} umbral={umbral} />}

      {evaluacion && !aprobado && (
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("tutor:abrir", {
                detail: {
                  mensaje: `Estoy repasando "${temaNombre}". Hazme 2 preguntas de calentamiento para afinar mi explicacion, sin darme la respuesta.`,
                },
              })
            )
          }
          className="self-start text-sm font-semibold text-primary hover:underline"
        >
          Pedir ayuda al tutor antes de reintentar
        </button>
      )}
    </div>
  );
}

function ResultadoFeynman({
  evaluacion,
  umbral,
}: {
  evaluacion: EvaluacionFeynmanVista;
  umbral: number;
}) {
  const { puntaje, veredicto, fortalezas, brechas, sugerencias, aprobado } = evaluacion;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        aprobado ? "border-success/30 bg-success-soft/40" : "border-warning/30 bg-warning-soft/40"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold",
            aprobado ? "bg-success text-white" : "bg-warning text-white"
          )}
        >
          {puntaje}
        </span>
        <div>
          <div className="flex items-center gap-1.5 font-bold">
            {aprobado ? (
              <>
                <Check className="h-4 w-4 text-success" /> Reto superado
              </>
            ) : (
              <>
                <CircleAlert className="h-4 w-4 text-warning" /> Casi. Necesitas {umbral}/100
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{veredicto}</p>
        </div>
      </div>

      {fortalezas.length > 0 && (
        <div className="text-sm">
          <div className="font-semibold">Lo que explicaste bien</div>
          <ul className="ml-5 mt-1 list-disc text-muted-foreground">
            {fortalezas.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {brechas.length > 0 && (
        <div className="text-sm">
          <div className="font-semibold">Que te falta afinar</div>
          <ul className="ml-5 mt-1 list-disc text-muted-foreground">
            {brechas.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {sugerencias && (
        <p className="text-sm">
          <span className="font-semibold">Siguiente paso: </span>
          <span className="text-muted-foreground">{sugerencias}</span>
        </p>
      )}
    </div>
  );
}
