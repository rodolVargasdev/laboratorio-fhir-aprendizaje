import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shuffle, Target } from "lucide-react";
import { auth } from "@/auth";
import { preguntasAdaptativas, preguntasFalladas, contarFalladas } from "@/lib/adaptive";
import { registrarSimulacro } from "@/lib/acciones";
import { Quiz } from "@/components/quiz";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Simulacro" };

const OPCIONES_N = [15, 25, 40];

export default async function SimulacroPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; modo?: string }>;
}) {
  const { n, modo } = await searchParams;
  const sesion = await auth();
  const usuarioId = sesion!.user.id;
  const esFallos = modo === "fallos";
  const cantidad = OPCIONES_N.includes(Number(n)) ? Number(n) : 15;

  const [preguntas, nFallos] = await Promise.all([
    esFallos ? preguntasFalladas(usuarioId) : preguntasAdaptativas(usuarioId, cantidad),
    contarFalladas(usuarioId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <Shuffle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {esFallos ? "Repaso de fallos" : "Simulacro intercalado"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {esFallos
              ? "Solo las preguntas que aun fallas mas de lo que aciertas."
              : "Preguntas de todos los temas, priorizando tus puntos debiles."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/simulacro"
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
            !esFallos ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          )}
        >
          Simulacro
        </Link>
        <Link
          href="/simulacro?modo=fallos"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
            esFallos ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          )}
        >
          <Target className="h-3.5 w-3.5" /> Repaso de fallos ({nFallos})
        </Link>
      </div>

      {!esFallos && (
        <div className="flex flex-wrap gap-2">
          {OPCIONES_N.map((op) => (
            <Link
              key={op}
              href={`/simulacro?n=${op}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                op === cantidad ? "border-primary bg-primary-soft text-navy-2" : "border-border bg-card hover:bg-muted"
              )}
            >
              {op} preguntas
            </Link>
          ))}
        </div>
      )}

      {preguntas.length > 0 ? (
        <Quiz
          key={`${esFallos ? "fallos" : cantidad}`}
          preguntas={preguntas}
          mejorPrevio={null}
          registrar={registrarSimulacro}
          mostrarMaestria={false}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {esFallos
            ? "No tienes preguntas falladas pendientes. Buen trabajo."
            : "Aun no hay preguntas disponibles."}
        </div>
      )}
    </div>
  );
}
