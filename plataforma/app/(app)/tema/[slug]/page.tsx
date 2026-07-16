import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  Terminal,
  ListChecks,
  Flag,
  Layers,
  Check,
  ExternalLink,
  Target,
} from "lucide-react";
import { auth } from "@/auth";
import { obtenerTema } from "@/lib/contenido";
import { Markdown } from "@/components/markdown";
import { IndiceLeccion } from "@/components/indice-leccion";
import { PasoMarcable } from "@/components/paso-marcable";
import { PasoNotebookLM } from "@/components/paso-notebooklm";
import { Quiz, type PreguntaQuiz } from "@/components/quiz";
import { registrarIntentoQuiz } from "@/lib/acciones";
import type { TipoPaso } from "@/generated/prisma/enums";

const ICONO: Record<TipoPaso, React.ComponentType<{ className?: string }>> = {
  LECTURA: BookOpen,
  NOTEBOOKLM: Headphones,
  PRACTICA: Terminal,
  QUIZ: ListChecks,
  PRACTICA_NACIONAL: Flag,
  TARJETAS: Layers,
};

type Enlace = { titulo: string; url: string; nota?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sesion = await auth();
  if (!sesion?.user?.id) return { title: "Tema" };
  const tema = await obtenerTema(slug, sesion.user.id);
  return { title: tema?.nombre ?? "Tema" };
}

export default async function TemaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sesion = await auth();
  const usuarioId = sesion!.user.id;
  const tema = await obtenerTema(slug, usuarioId);
  if (!tema) notFound();

  const enlaces = (tema.enlaces as Enlace[] | null) ?? [];
  const obligatorios = tema.pasos.filter((p) => p.obligatorio);
  const hechos = obligatorios.filter((p) => p.completado).length;
  const primerPendiente = tema.pasos.find((p) => p.obligatorio && !p.completado)?.id;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/panel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-primary">
          {tema.etapa.nombre}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">{tema.nombre}</h1>
        {tema.resumen && <p className="text-muted-foreground">{tema.resumen}</p>}

        <div className="mt-1 flex items-center gap-3">
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${obligatorios.length ? (hechos / obligatorios.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            {hechos}/{obligatorios.length} pasos
          </span>
        </div>
      </header>

      {tema.objetivos.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Target className="h-4 w-4 text-primary" /> Al terminar podras
          </div>
          <ul className="ml-5 list-disc text-sm text-muted-foreground">
            {tema.objetivos.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {tema.pasos.map((paso, i) => {
          const Icono = ICONO[paso.tipo];
          const abierto = paso.id === primerPendiente;
          return (
            <li key={paso.id}>
              <details
                open={abierto}
                className="group rounded-lg border border-border bg-card [&[open]]:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                      paso.completado
                        ? "border-success bg-success text-white"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {paso.completado ? <Check className="h-4 w-4" /> : <Icono className="h-4 w-4" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs text-muted-foreground">Paso {i + 1}</span>
                    <span className="block font-semibold">{paso.titulo}</span>
                  </span>
                  {!paso.obligatorio && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      opcional
                    </span>
                  )}
                </summary>

                <div className="border-t border-border p-4">
                  <PasoCuerpo tema={tema} paso={paso} />
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {enlaces.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 text-sm font-bold">Si algo no quedo claro</div>
          <ul className="flex flex-col gap-2">
            {enlaces.map((e, i) => (
              <li key={i}>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {e.titulo}
                </a>
                {e.nota && <span className="text-sm text-muted-foreground"> — {e.nota}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PasoCuerpo({
  tema,
  paso,
}: {
  tema: NonNullable<Awaited<ReturnType<typeof obtenerTema>>>;
  paso: NonNullable<Awaited<ReturnType<typeof obtenerTema>>>["pasos"][number];
}) {
  if (paso.tipo === "QUIZ") {
    const preguntas: PreguntaQuiz[] = tema.preguntas.map((p) => ({
      id: p.id,
      tipo: p.tipo,
      enunciado: p.enunciado,
      opciones: (p.opciones as string[] | null) ?? null,
      respuestaIndice: p.respuestaIndice,
      respuestaBool: p.respuestaBool,
      respuestasValidas: p.respuestasValidas,
      explicacion: p.explicacion,
    }));
    return (
      <Quiz
        preguntas={preguntas}
        mejorPrevio={tema.mejorQuiz}
        registrar={registrarIntentoQuiz.bind(null, tema.id, tema.slug)}
      />
    );
  }

  if (paso.tipo === "NOTEBOOKLM") {
    const cfg =
      (tema.notebooklm as {
        nombreCuaderno?: string;
        fuentes?: { titulo: string; url: string }[];
      } | null) ?? {};
    // Fuentes exactas a pegar en NotebookLM: las del tema o, si faltan, sus enlaces.
    const fuentes =
      cfg.fuentes && cfg.fuentes.length > 0
        ? cfg.fuentes.slice(0, 4)
        : ((tema.enlaces as Enlace[] | null) ?? []).slice(0, 3).map((e) => ({
            titulo: e.titulo,
            url: e.url,
          }));
    return (
      <PasoNotebookLM
        pasoId={paso.id}
        temaId={tema.id}
        temaSlug={tema.slug}
        nombreCuaderno={cfg.nombreCuaderno ?? `FHIR - ${tema.nombre}`}
        fuentes={fuentes}
        completado={paso.completado}
        datosIniciales={paso.datos as { items?: boolean[] } | null}
      />
    );
  }

  if (paso.tipo === "TARJETAS") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Este tema tiene {tema._count.tarjetas} tarjetas para repaso espaciado. El repaso
          diario se hace desde la seccion de tarjetas.
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/repaso"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ir a repasar
          </Link>
          <span className="text-muted-foreground">·</span>
          <PasoMarcable
            pasoId={paso.id}
            temaId={tema.id}
            temaSlug={tema.slug}
            completado={paso.completado}
            etiqueta="Marcar repaso hecho"
          />
        </div>
      </div>
    );
  }

  // LECTURA: markdown con indice lateral (TOC) + marcar
  if (paso.tipo === "LECTURA") {
    return (
      <div className="flex flex-col gap-4">
        {paso.contenido ? (
          <div className="lg:flex lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1">
              <IndiceLeccion markdown={paso.contenido} variante="movil" />
              <Markdown>{paso.contenido}</Markdown>
            </div>
            <IndiceLeccion markdown={paso.contenido} variante="escritorio" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Contenido en preparacion.</p>
        )}
        <div>
          <PasoMarcable
            pasoId={paso.id}
            temaId={tema.id}
            temaSlug={tema.slug}
            completado={paso.completado}
            etiqueta="Termine la lectura"
          />
        </div>
      </div>
    );
  }

  // PRACTICA / PRACTICA_NACIONAL: markdown + marcar
  return (
    <div className="flex flex-col gap-4">
      {paso.contenido ? (
        <Markdown>{paso.contenido}</Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">Contenido en preparacion.</p>
      )}
      <div>
        <PasoMarcable
          pasoId={paso.id}
          temaId={tema.id}
          temaSlug={tema.slug}
          completado={paso.completado}
          etiqueta="Marcar como hecho"
        />
      </div>
    </div>
  );
}
