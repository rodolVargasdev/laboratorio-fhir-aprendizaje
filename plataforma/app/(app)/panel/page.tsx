import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check, Compass, Map, Award } from "lucide-react";
import { auth } from "@/auth";
import { obtenerCurriculo, siguienteAccion, nivelPreparacion, type TemaVista } from "@/lib/contenido";
import { ultimoDiagnostico } from "@/lib/adaptive";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Panel" };

const BADGE: Record<string, { texto: string; clase: string }> = {
  NO_INICIADO: { texto: "Sin empezar", clase: "bg-muted text-muted-foreground" },
  EN_PROGRESO: { texto: "En progreso", clase: "bg-primary-soft text-navy-2" },
  COMPLETADO: { texto: "Completado", clase: "bg-success-soft text-success" },
};

export default async function PanelPage() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  const usuarioId = sesion.user.id;
  const nombre = sesion.user.name?.split(" ")[0] || "estudiante";

  const [etapas, siguiente, prep, diag] = await Promise.all([
    obtenerCurriculo(usuarioId),
    siguienteAccion(usuarioId),
    nivelPreparacion(usuarioId),
    ultimoDiagnostico(usuarioId),
  ]);

  const SEMAFORO: Record<string, { texto: string; clase: string }> = {
    rojo: { texto: "En construccion", clase: "border-danger/30 bg-danger-soft/40 text-danger" },
    amarillo: { texto: "Avanzando", clase: "border-warning/30 bg-warning-soft/50 text-warning" },
    verde: { texto: "Listo para examen", clase: "border-success/30 bg-success-soft/50 text-success" },
  };
  const sem = SEMAFORO[prep.nivel];

  const totalTemas = etapas.flatMap((e) => e.temas).filter((t) => !t.opcional).length;
  const completados = etapas
    .flatMap((e) => e.temas)
    .filter((t) => !t.opcional && t.estado === "COMPLETADO").length;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-extrabold tracking-tight">Hola, {nombre}.</h1>
        <p className="mt-1 text-muted-foreground">
          Tu ruta para aprender FHIR paso a paso. Avanza de arriba hacia abajo.
        </p>
      </section>

      {/* Primera vez: recorrido por la plataforma */}
      {completados === 0 && (
        <Link
          href="/como-funciona"
          className="flex items-center gap-3 rounded-lg border border-navy/20 bg-card p-4 transition-colors hover:bg-muted"
        >
          <Map className="h-5 w-5 shrink-0 text-navy" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Nuevo aqui?</span>{" "}
            <span className="text-muted-foreground">
              Haz el recorrido: como funciona cada seccion, la metodologia de aprendizaje y
              que necesitas antes de empezar.
            </span>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* Siguiente accion */}
      {siguiente ? (
        <Link
          href={`/tema/${siguiente.tema.slug}`}
          className="group flex items-center gap-4 rounded-xl border border-primary/30 bg-primary-soft/50 p-5 transition-colors hover:bg-primary-soft"
        >
          <Compass className="h-6 w-6 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-primary">
              Tu siguiente paso
            </div>
            <div className="text-lg font-bold">{siguiente.tema.nombre}</div>
            <div className="text-sm text-muted-foreground">{siguiente.etapa.nombre}</div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
        </Link>
      ) : (
        <div className="rounded-xl border border-success/30 bg-success-soft/50 p-5">
          <div className="font-bold">Completaste la ruta.</div>
          <p className="text-sm text-muted-foreground">
            Repasa con las tarjetas y prepara tu examen.
          </p>
        </div>
      )}

      {/* Diagnostico inicial (si nunca lo hizo) */}
      {!diag && (
        <Link
          href="/diagnostico"
          className="flex items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-card p-3 text-sm hover:bg-muted"
        >
          <span className="font-semibold text-primary">Haz tu diagnostico inicial</span>
          <span className="text-muted-foreground">
            10 preguntas para saber por donde empezar.
          </span>
        </Link>
      )}

      {/* Progreso global */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${totalTemas ? (completados / totalTemas) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          {completados}/{totalTemas} temas
        </span>
      </div>

      {/* Semaforo de preparacion */}
      <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3 text-sm", sem.clase)}>
        <span className="font-bold">Preparacion: {sem.texto}</span>
        <span className="text-muted-foreground">Temas {prep.completos}/{prep.total}</span>
        <span className="text-muted-foreground">Promedio quiz {prep.promedioQuiz}%</span>
        <span className="text-muted-foreground">Retencion {prep.retencion}%</span>
        <Link
          href="/certificaciones"
          className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <Award className="h-4 w-4" /> Las 3 certificaciones
        </Link>
      </div>

      {/* Etapas y temas */}
      {etapas.map((etapa) => (
        <section key={etapa.id} className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg font-bold">
              {etapa.numero < 0 ? "Prerrequisitos" : `Etapa ${etapa.numero}`} · {etapa.nombre}
            </h2>
            {etapa.meta && <p className="text-sm text-muted-foreground">{etapa.meta}</p>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {etapa.temas.map((tema) => (
              <TarjetaTema key={tema.id} tema={tema} esSiguiente={siguiente?.tema.id === tema.id} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TarjetaTema({ tema, esSiguiente }: { tema: TemaVista; esSiguiente: boolean }) {
  const badge = BADGE[tema.estado] ?? BADGE.NO_INICIADO;
  const pct = tema.pasosTotal ? (tema.pasosHechos / tema.pasosTotal) * 100 : 0;
  return (
    <Link
      href={`/tema/${tema.slug}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40",
        esSiguiente ? "border-primary/50" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{tema.nombre}</h3>
        {tema.estado === "COMPLETADO" ? (
          <Check className="h-4 w-4 shrink-0 text-success" />
        ) : tema.opcional ? (
          <span className="text-xs text-muted-foreground">opcional</span>
        ) : null}
      </div>
      {tema.resumen && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{tema.resumen}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-1">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", badge.clase)}>
          {badge.texto}
        </span>
        {tema.mejorQuiz != null && (
          <span className="text-xs text-muted-foreground">mejor quiz: {tema.mejorQuiz}%</span>
        )}
        {tema.estado === "EN_PROGRESO" && (
          <span className="ml-auto text-xs text-muted-foreground">
            {tema.pasosHechos}/{tema.pasosTotal}
          </span>
        )}
      </div>
      {tema.estado === "EN_PROGRESO" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
    </Link>
  );
}
