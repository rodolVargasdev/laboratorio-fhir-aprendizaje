import "server-only";
import { prisma } from "@/lib/db";

/**
 * Limite de uso del tutor IA, PROPORCIONAL al numero de usuarios: hay un presupuesto
 * global de preguntas por dia (protege la cuota gratuita de Gemini) que se reparte entre
 * los usuarios registrados. Cupo por usuario = presupuesto / usuarios, acotado a [min, max].
 * La ventana es el dia natural (UTC): se reinicia a medianoche.
 */
const PRESUPUESTO_DIARIO_GLOBAL = Number(process.env.TUTOR_PRESUPUESTO_DIARIO ?? 300);
const MIN_POR_USUARIO = Number(process.env.TUTOR_MIN_DIARIO ?? 15);
const MAX_POR_USUARIO = Number(process.env.TUTOR_MAX_DIARIO ?? 60);

export type EstadoLimiteTutor = {
  limite: number; // preguntas permitidas hoy a este usuario
  usados: number; // preguntas ya hechas hoy
  restantes: number; // limite - usados (>= 0)
};

/** Inicio del dia natural en UTC (ventana de conteo). */
function inicioDelDia(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

/** Cupo diario por usuario segun cuantos usuarios hay (proporcional, acotado). */
export async function cupoDiarioPorUsuario(): Promise<number> {
  const usuarios = await prisma.user.count();
  const base = usuarios > 0 ? Math.floor(PRESUPUESTO_DIARIO_GLOBAL / usuarios) : MAX_POR_USUARIO;
  return Math.max(MIN_POR_USUARIO, Math.min(MAX_POR_USUARIO, base));
}

/** Preguntas del usuario al tutor en el dia actual. */
export async function usoHoy(usuarioId: string): Promise<number> {
  return prisma.mensajeTutor.count({
    where: {
      rol: "user",
      creado: { gte: inicioDelDia() },
      conversacion: { usuarioId },
    },
  });
}

/** Estado completo del limite para mostrarlo y decidir si se permite otra pregunta. */
export async function estadoLimiteTutor(usuarioId: string): Promise<EstadoLimiteTutor> {
  const [limite, usados] = await Promise.all([cupoDiarioPorUsuario(), usoHoy(usuarioId)]);
  return { limite, usados, restantes: Math.max(0, limite - usados) };
}
