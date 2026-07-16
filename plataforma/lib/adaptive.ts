import "server-only";
import { prisma } from "@/lib/db";

export type PreguntaSel = {
  id: string;
  tipo: "OPCION_MULTIPLE" | "VERDADERO_FALSO" | "RESPUESTA_CORTA";
  enunciado: string;
  opciones: string[] | null;
  respuestaIndice: number | null;
  respuestaBool: boolean | null;
  respuestasValidas: string[];
  explicacion: string | null;
};

function aSel(p: {
  id: string;
  tipo: PreguntaSel["tipo"];
  enunciado: string;
  opciones: unknown;
  respuestaIndice: number | null;
  respuestaBool: boolean | null;
  respuestasValidas: string[];
  explicacion: string | null;
}): PreguntaSel {
  return {
    id: p.id,
    tipo: p.tipo,
    enunciado: p.enunciado,
    opciones: (p.opciones as string[] | null) ?? null,
    respuestaIndice: p.respuestaIndice,
    respuestaBool: p.respuestaBool,
    respuestasValidas: p.respuestasValidas,
    explicacion: p.explicacion,
  };
}

const SELECT_PREGUNTA = {
  id: true,
  tipo: true,
  enunciado: true,
  opciones: true,
  respuestaIndice: true,
  respuestaBool: true,
  respuestasValidas: true,
  explicacion: true,
} as const;

function barajar<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * Selecciona n preguntas priorizando las debiles del usuario:
 * 1) falladas mas que acertadas, 2) nunca vistas, 3) el resto.
 * Dentro de cada grupo, al azar. Base de un simulacro adaptativo.
 */
export async function preguntasAdaptativas(usuarioId: string, n: number): Promise<PreguntaSel[]> {
  const [preguntas, stats] = await Promise.all([
    prisma.pregunta.findMany({ select: SELECT_PREGUNTA }),
    prisma.estadisticaPregunta.findMany({ where: { usuarioId } }),
  ]);
  const porId = new Map(stats.map((s) => [s.preguntaId, s]));

  const debiles: typeof preguntas = [];
  const nuevas: typeof preguntas = [];
  const resto: typeof preguntas = [];
  for (const p of preguntas) {
    const s = porId.get(p.id);
    if (!s) nuevas.push(p);
    else if (s.vecesFallada > s.vecesAcertada) debiles.push(p);
    else resto.push(p);
  }

  const orden = [...barajar(debiles), ...barajar(nuevas), ...barajar(resto)];
  return barajar(orden.slice(0, n)).map(aSel);
}

/** Preguntas que el usuario aun falla mas de lo que acierta (repaso de fallos). */
export async function preguntasFalladas(usuarioId: string, limite = 30): Promise<PreguntaSel[]> {
  const stats = await prisma.estadisticaPregunta.findMany({
    where: { usuarioId },
    orderBy: { vecesFallada: "desc" },
  });
  const idsDebiles = stats.filter((s) => s.vecesFallada > s.vecesAcertada).map((s) => s.preguntaId);
  if (!idsDebiles.length) return [];
  const preguntas = await prisma.pregunta.findMany({
    where: { id: { in: idsDebiles.slice(0, limite) } },
    select: SELECT_PREGUNTA,
  });
  return barajar(preguntas).map(aSel);
}

/** Cuenta cuantas preguntas debiles tiene el usuario (para mostrar en la UI). */
export async function contarFalladas(usuarioId: string): Promise<number> {
  const stats = await prisma.estadisticaPregunta.findMany({ where: { usuarioId } });
  return stats.filter((s) => s.vecesFallada > s.vecesAcertada).length;
}

/** Ultimo diagnostico del usuario (o null si nunca lo hizo). */
export async function ultimoDiagnostico(usuarioId: string) {
  const d = await prisma.diagnostico.findFirst({
    where: { usuarioId },
    orderBy: { creado: "desc" },
  });
  if (!d) return null;
  return d.datos as { porcentaje: number; recomendacion: string };
}
