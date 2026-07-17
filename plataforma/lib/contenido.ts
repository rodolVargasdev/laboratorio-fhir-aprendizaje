import "server-only";
import { prisma } from "@/lib/db";
import type { TipoPaso } from "@/generated/prisma/enums";

// Orden canonico de la "clase" (por si el orden en BD faltara).
export const ORDEN_PASOS: TipoPaso[] = [
  "LECTURA",
  "NOTEBOOKLM",
  "PRACTICA",
  "FEYNMAN",
  "QUIZ",
  "PRACTICA_NACIONAL",
  "TARJETAS",
];

export const ETIQUETA_PASO: Record<TipoPaso, string> = {
  LECTURA: "Lectura",
  NOTEBOOKLM: "NotebookLM",
  PRACTICA: "Practica en la PC",
  FEYNMAN: "Reto Feynman",
  QUIZ: "Quiz del tema",
  PRACTICA_NACIONAL: "Practica nacional",
  TARJETAS: "Tarjetas de repaso",
};

export const UMBRAL_MAESTRIA = 80;

/** Curriculo completo con el progreso del usuario, listo para el panel y la ruta. */
export async function obtenerCurriculo(usuarioId: string) {
  const [etapas, progresoTemas, mejores, progresoPasos] = await Promise.all([
    prisma.etapa.findMany({
      orderBy: { orden: "asc" },
      include: {
        temas: {
          orderBy: { orden: "asc" },
          include: {
            pasos: { orderBy: { orden: "asc" } },
            _count: { select: { preguntas: true, tarjetas: true } },
          },
        },
      },
    }),
    prisma.progresoTema.findMany({ where: { usuarioId } }),
    prisma.intentoQuiz.groupBy({
      by: ["temaId"],
      where: { usuarioId },
      _max: { porcentaje: true },
    }),
    prisma.progresoPaso.findMany({ where: { usuarioId, completado: true } }),
  ]);

  const estadoPorTema = new Map(progresoTemas.map((p) => [p.temaId, p.estado]));
  const mejorPorTema = new Map(mejores.map((m) => [m.temaId, m._max.porcentaje ?? null]));
  const pasosHechos = new Set(progresoPasos.map((p) => p.pasoId));

  const etapasVista = etapas.map((e) => ({
    id: e.id,
    numero: e.numero,
    slug: e.slug,
    nombre: e.nombre,
    meta: e.meta,
    temas: e.temas.map((t) => {
      const total = t.pasos.filter((p) => p.obligatorio).length;
      const hechos = t.pasos.filter((p) => p.obligatorio && pasosHechos.has(p.id)).length;
      return {
        id: t.id,
        slug: t.slug,
        numero: t.numero,
        nombre: t.nombre,
        resumen: t.resumen,
        opcional: t.opcional,
        estado: estadoPorTema.get(t.id) ?? "NO_INICIADO",
        mejorQuiz: mejorPorTema.get(t.id) ?? null,
        pasosTotal: total,
        pasosHechos: hechos,
        nPreguntas: t._count.preguntas,
        nTarjetas: t._count.tarjetas,
      };
    }),
  }));

  return etapasVista;
}

export type EtapaVista = Awaited<ReturnType<typeof obtenerCurriculo>>[number];
export type TemaVista = EtapaVista["temas"][number];

/** Primera accion pendiente (tema + paso) recorriendo la ruta en orden. */
export async function siguienteAccion(usuarioId: string) {
  const etapas = await obtenerCurriculo(usuarioId);
  for (const etapa of etapas) {
    for (const tema of etapa.temas) {
      if (tema.opcional) continue;
      if (tema.estado !== "COMPLETADO") {
        return { etapa, tema };
      }
    }
  }
  return null;
}

/** Un tema con sus pasos, preguntas y el progreso del usuario. */
export async function obtenerTema(slug: string, usuarioId: string) {
  const tema = await prisma.tema.findUnique({
    where: { slug },
    include: {
      etapa: true,
      pasos: { orderBy: { orden: "asc" } },
      preguntas: { orderBy: { orden: "asc" } },
      _count: { select: { tarjetas: true } },
    },
  });
  if (!tema) return null;

  const [progresoPasos, mejor, progresoTema, feynman] = await Promise.all([
    prisma.progresoPaso.findMany({
      where: { usuarioId, pasoId: { in: tema.pasos.map((p) => p.id) } },
    }),
    prisma.intentoQuiz.aggregate({
      where: { usuarioId, temaId: tema.id },
      _max: { porcentaje: true },
    }),
    prisma.progresoTema.findUnique({
      where: { usuarioId_temaId: { usuarioId, temaId: tema.id } },
    }),
    prisma.retoFeynman.findFirst({
      where: { usuarioId, temaId: tema.id },
      orderBy: { creado: "desc" },
    }),
  ]);

  const hechos = new Map(progresoPasos.map((p) => [p.pasoId, p]));

  return {
    ...tema,
    mejorQuiz: mejor._max.porcentaje ?? null,
    estado: progresoTema?.estado ?? "NO_INICIADO",
    feynman,
    pasos: tema.pasos.map((p) => ({
      ...p,
      completado: hechos.get(p.id)?.completado ?? false,
      datos: hechos.get(p.id)?.datos ?? null,
    })),
  };
}

export type TemaDetalle = NonNullable<Awaited<ReturnType<typeof obtenerTema>>>;

/** Semaforo de preparacion para el examen (rojo/amarillo/verde). */
export async function nivelPreparacion(usuarioId: string) {
  const [etapas, mejores, repasos, totalTarjetas] = await Promise.all([
    obtenerCurriculo(usuarioId),
    prisma.intentoQuiz.groupBy({ by: ["temaId"], where: { usuarioId }, _max: { porcentaje: true } }),
    prisma.repasoTarjeta.count({ where: { usuarioId, caja: { gte: 4 } } }),
    prisma.tarjeta.count(),
  ]);

  const temas = etapas.flatMap((e) => e.temas).filter((t) => !t.opcional);
  const total = temas.length;
  const completos = temas.filter((t) => t.estado === "COMPLETADO").length;
  const promedioQuiz = mejores.length
    ? Math.round(mejores.reduce((s, m) => s + (m._max.porcentaje ?? 0), 0) / mejores.length)
    : 0;
  const retencion = totalTarjetas ? Math.round((repasos / totalTarjetas) * 100) : 0;

  const pctTemas = total ? completos / total : 0;
  let nivel: "rojo" | "amarillo" | "verde" = "rojo";
  if (pctTemas >= 0.9 && promedioQuiz >= 80 && retencion >= 60) nivel = "verde";
  else if (pctTemas >= 0.4) nivel = "amarillo";

  return { nivel, completos, total, promedioQuiz, retencion };
}

/** Preguntas al azar de todos los temas para un simulacro intercalado. */
export async function obtenerPreguntasSimulacro(n: number) {
  const preguntas = await prisma.pregunta.findMany({
    select: {
      id: true,
      tipo: true,
      enunciado: true,
      opciones: true,
      respuestaIndice: true,
      respuestaBool: true,
      respuestasValidas: true,
      explicacion: true,
    },
  });
  // Mezcla (Fisher-Yates) y toma n.
  for (let i = preguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]];
  }
  return preguntas.slice(0, n).map((p) => ({
    id: p.id,
    tipo: p.tipo,
    enunciado: p.enunciado,
    opciones: (p.opciones as string[] | null) ?? null,
    respuestaIndice: p.respuestaIndice,
    respuestaBool: p.respuestaBool,
    respuestasValidas: p.respuestasValidas,
    explicacion: p.explicacion,
  }));
}
