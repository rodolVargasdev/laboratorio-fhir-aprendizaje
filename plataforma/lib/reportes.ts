import "server-only";
import { prisma } from "@/lib/db";
import { obtenerCurriculo } from "@/lib/contenido";

export type FilaEstudiante = {
  id: string;
  nombre: string | null;
  email: string | null;
  temasCompletados: number;
  temasTotal: number;
  promedioQuiz: number | null; // media del mejor intento por tema (null si nunca hizo quiz)
  retencion: number; // % de tarjetas en caja >= 4
  feynmanAprobados: number; // temas con reto Feynman superado
  ultimaActividad: Date | null;
};

export type ResumenGlobal = {
  nEstudiantes: number;
  temasTotal: number;
  promedioTemasCompletados: number; // media por estudiante
  promedioQuiz: number | null; // media global de promedios por estudiante
  retencionMedia: number;
  feynmanAprobadosTotal: number; // suma de temas superados por todos
};

/** Reporte global + fila por estudiante (solo rol ESTUDIANTE). */
export async function obtenerReporte(): Promise<{
  resumen: ResumenGlobal;
  estudiantes: FilaEstudiante[];
}> {
  const [
    estudiantes,
    temasTotal,
    totalTarjetas,
    completadosPorUsuario,
    mejoresPorTema,
    feynPorTema,
    retenidasPorUsuario,
    ultPaso,
    ultQuiz,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { rol: "ESTUDIANTE" },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tema.count({ where: { opcional: false } }),
    prisma.tarjeta.count(),
    prisma.progresoTema.groupBy({
      by: ["usuarioId"],
      where: { estado: "COMPLETADO", tema: { opcional: false } },
      _count: { _all: true },
    }),
    prisma.intentoQuiz.groupBy({
      by: ["usuarioId", "temaId"],
      _max: { porcentaje: true },
    }),
    prisma.retoFeynman.groupBy({
      by: ["usuarioId", "temaId"],
      where: { aprobado: true },
      _count: { _all: true },
    }),
    prisma.repasoTarjeta.groupBy({
      by: ["usuarioId"],
      where: { caja: { gte: 4 } },
      _count: { _all: true },
    }),
    prisma.progresoPaso.groupBy({ by: ["usuarioId"], _max: { actualizado: true } }),
    prisma.intentoQuiz.groupBy({ by: ["usuarioId"], _max: { creado: true } }),
  ]);

  const completados = new Map(completadosPorUsuario.map((c) => [c.usuarioId, c._count._all]));
  const retenidas = new Map(retenidasPorUsuario.map((r) => [r.usuarioId, r._count._all]));
  const feynAprob = new Map<string, number>();
  for (const f of feynPorTema) {
    feynAprob.set(f.usuarioId, (feynAprob.get(f.usuarioId) ?? 0) + 1);
  }
  // Media del mejor quiz por usuario (sobre los temas que intento).
  const quizPorUsuario = new Map<string, { suma: number; n: number }>();
  for (const m of mejoresPorTema) {
    const p = m._max.porcentaje;
    if (p == null) continue;
    const acc = quizPorUsuario.get(m.usuarioId) ?? { suma: 0, n: 0 };
    acc.suma += p;
    acc.n += 1;
    quizPorUsuario.set(m.usuarioId, acc);
  }
  const ultPasoMap = new Map(ultPaso.map((u) => [u.usuarioId, u._max.actualizado]));
  const ultQuizMap = new Map(ultQuiz.map((u) => [u.usuarioId, u._max.creado]));

  const filas: FilaEstudiante[] = estudiantes.map((e) => {
    const q = quizPorUsuario.get(e.id);
    const promedioQuiz = q && q.n ? Math.round(q.suma / q.n) : null;
    const fechas = [ultPasoMap.get(e.id), ultQuizMap.get(e.id)].filter(Boolean) as Date[];
    const ultimaActividad = fechas.length
      ? new Date(Math.max(...fechas.map((d) => d.getTime())))
      : null;
    return {
      id: e.id,
      nombre: e.name,
      email: e.email,
      temasCompletados: completados.get(e.id) ?? 0,
      temasTotal,
      promedioQuiz,
      retencion: totalTarjetas ? Math.round(((retenidas.get(e.id) ?? 0) / totalTarjetas) * 100) : 0,
      feynmanAprobados: feynAprob.get(e.id) ?? 0,
      ultimaActividad,
    };
  });

  const n = filas.length;
  const prom = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((s, x) => s + x, 0) / nums.length) : 0;
  const quizzes = filas.map((f) => f.promedioQuiz).filter((x): x is number => x != null);

  const resumen: ResumenGlobal = {
    nEstudiantes: n,
    temasTotal,
    promedioTemasCompletados: prom(filas.map((f) => f.temasCompletados)),
    promedioQuiz: quizzes.length ? prom(quizzes) : null,
    retencionMedia: prom(filas.map((f) => f.retencion)),
    feynmanAprobadosTotal: filas.reduce((s, f) => s + f.feynmanAprobados, 0),
  };

  return { resumen, estudiantes: filas };
}

export type DetalleTema = {
  temaId: string;
  nombre: string;
  etapa: string;
  opcional: boolean;
  estado: string;
  mejorQuiz: number | null;
  intentosQuiz: number;
  feynmanPuntaje: number | null;
  feynmanAprobado: boolean;
};

/** Ficha detallada de un estudiante: desglose por tema + diagnostico. */
export async function detalleEstudiante(usuarioId: string): Promise<{
  usuario: { id: string; nombre: string | null; email: string | null } | null;
  temas: DetalleTema[];
  diagnostico: { porcentaje: number; recomendacion: string; creado: Date } | null;
} | null> {
  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { id: true, name: true, email: true },
  });
  if (!usuario) return null;

  const [etapas, intentosPorTema, feynParaUsuario, diag] = await Promise.all([
    obtenerCurriculo(usuarioId),
    prisma.intentoQuiz.groupBy({
      by: ["temaId"],
      where: { usuarioId },
      _count: { _all: true },
    }),
    prisma.retoFeynman.findMany({
      where: { usuarioId },
      orderBy: { creado: "desc" },
      select: { temaId: true, puntaje: true, aprobado: true },
    }),
    prisma.diagnostico.findFirst({ where: { usuarioId }, orderBy: { creado: "desc" } }),
  ]);

  const nIntentos = new Map(intentosPorTema.map((i) => [i.temaId, i._count._all]));
  // Mejor Feynman por tema: mejor puntaje y aprobado si algun intento lo supero.
  const mejorFeyn = new Map<string, { puntaje: number; aprobado: boolean }>();
  for (const f of feynParaUsuario) {
    const prev = mejorFeyn.get(f.temaId);
    mejorFeyn.set(f.temaId, {
      puntaje: Math.max(prev?.puntaje ?? 0, f.puntaje),
      aprobado: (prev?.aprobado ?? false) || f.aprobado,
    });
  }

  const temas: DetalleTema[] = etapas.flatMap((etapa) =>
    etapa.temas.map((t) => {
      const feyn = mejorFeyn.get(t.id);
      return {
        temaId: t.id,
        nombre: t.nombre,
        etapa: etapa.nombre,
        opcional: t.opcional,
        estado: t.estado,
        mejorQuiz: t.mejorQuiz,
        intentosQuiz: nIntentos.get(t.id) ?? 0,
        feynmanPuntaje: feyn?.puntaje ?? null,
        feynmanAprobado: feyn?.aprobado ?? false,
      };
    })
  );

  const datos = diag?.datos as { porcentaje?: number; recomendacion?: string } | null;
  const diagnostico =
    diag && datos
      ? {
          porcentaje: datos.porcentaje ?? 0,
          recomendacion: datos.recomendacion ?? "",
          creado: diag.creado,
        }
      : null;

  return {
    usuario: { id: usuario.id, nombre: usuario.name, email: usuario.email },
    temas,
    diagnostico,
  };
}
