"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UMBRAL_MAESTRIA } from "@/lib/contenido";
import { siguienteCaja, proximaFecha, INTERVALOS_DIAS } from "@/lib/sr";

async function usuarioActual() {
  const sesion = await auth();
  if (!sesion?.user?.id) throw new Error("No autenticado");
  return sesion.user.id;
}

async function exigirAdmin() {
  const sesion = await auth();
  if (sesion?.user?.rol !== "ADMIN") throw new Error("Solo el administrador puede hacer esto");
  return sesion.user.id;
}

/** El admin crea (o reactiva) un usuario con correo, nombre y contrasena inicial. */
export async function crearUsuario(input: {
  email: string;
  nombre: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  await exigirAdmin();
  const email = input.email.trim().toLowerCase();
  const nombre = input.nombre.trim();
  const password = input.password;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Correo invalido" };
  if (password.length < 8) return { ok: false, error: "La contrasena debe tener al menos 8 caracteres" };

  const hash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.upsert({
      where: { email },
      update: { name: nombre || undefined, password: hash },
      create: { email, name: nombre || email.split("@")[0], password: hash, rol: "ESTUDIANTE" },
    });
  } catch {
    return { ok: false, error: "No se pudo crear el usuario" };
  }
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Recalcula el estado del tema a partir de los pasos obligatorios completados. */
async function recomputarEstadoTema(usuarioId: string, temaId: string) {
  const pasos = await prisma.paso.findMany({
    where: { temaId, obligatorio: true },
    select: { id: true },
  });
  const hechos = await prisma.progresoPaso.count({
    where: { usuarioId, completado: true, pasoId: { in: pasos.map((p) => p.id) } },
  });

  const estado =
    hechos === 0 ? "NO_INICIADO" : hechos >= pasos.length ? "COMPLETADO" : "EN_PROGRESO";

  await prisma.progresoTema.upsert({
    where: { usuarioId_temaId: { usuarioId, temaId } },
    update: { estado, completadoEn: estado === "COMPLETADO" ? new Date() : null },
    create: { usuarioId, temaId, estado, completadoEn: estado === "COMPLETADO" ? new Date() : null },
  });
  return estado;
}

/** Marca (o desmarca) un paso como completado. `datos` guarda estado extra (ej. checklist). */
export async function marcarPaso(input: {
  pasoId: string;
  temaId: string;
  temaSlug: string;
  completado: boolean;
  datos?: unknown;
}) {
  const usuarioId = await usuarioActual();
  await prisma.progresoPaso.upsert({
    where: { usuarioId_pasoId: { usuarioId, pasoId: input.pasoId } },
    update: {
      completado: input.completado,
      completadoEn: input.completado ? new Date() : null,
      datos: input.datos === undefined ? undefined : (input.datos as object),
    },
    create: {
      usuarioId,
      pasoId: input.pasoId,
      completado: input.completado,
      completadoEn: input.completado ? new Date() : null,
      datos: (input.datos ?? undefined) as object | undefined,
    },
  });

  const estado = await recomputarEstadoTema(usuarioId, input.temaId);
  revalidatePath("/panel");
  revalidatePath(`/tema/${input.temaSlug}`);
  return { estado };
}

/** Registra un intento de quiz; si alcanza la maestria, completa el paso QUIZ.
 *  Argumentos posicionales para poder enlazarlo con .bind desde el servidor. */
export async function registrarIntentoQuiz(
  temaId: string,
  temaSlug: string,
  detalle: { preguntaId: string; correcto: boolean }[]
) {
  const usuarioId = await usuarioActual();
  const total = detalle.length;
  const aciertos = detalle.filter((d) => d.correcto).length;
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;

  await prisma.intentoQuiz.create({
    data: { usuarioId, temaId, porcentaje, aciertos, total, detalle: detalle as object },
  });

  // Estadisticas por pregunta (para adaptividad y repaso de fallos).
  const ahora = new Date();
  for (const d of detalle) {
    await prisma.estadisticaPregunta.upsert({
      where: { usuarioId_preguntaId: { usuarioId, preguntaId: d.preguntaId } },
      update: {
        vecesVista: { increment: 1 },
        vecesAcertada: d.correcto ? { increment: 1 } : undefined,
        vecesFallada: d.correcto ? undefined : { increment: 1 },
        ultima: ahora,
      },
      create: {
        usuarioId,
        preguntaId: d.preguntaId,
        vecesVista: 1,
        vecesAcertada: d.correcto ? 1 : 0,
        vecesFallada: d.correcto ? 0 : 1,
        ultima: ahora,
      },
    });
  }

  const aprobado = porcentaje >= UMBRAL_MAESTRIA;
  if (aprobado) {
    const pasoQuiz = await prisma.paso.findUnique({
      where: { temaId_tipo: { temaId, tipo: "QUIZ" } },
      select: { id: true },
    });
    if (pasoQuiz) {
      await prisma.progresoPaso.upsert({
        where: { usuarioId_pasoId: { usuarioId, pasoId: pasoQuiz.id } },
        update: { completado: true, completadoEn: ahora },
        create: { usuarioId, pasoId: pasoQuiz.id, completado: true, completadoEn: ahora },
      });
    }
  }

  const estado = await recomputarEstadoTema(usuarioId, temaId);
  revalidatePath("/panel");
  revalidatePath(`/tema/${temaSlug}`);
  return { porcentaje, aciertos, total, aprobado, estado };
}

/** Registra la calificacion de una tarjeta y reprograma su proxima revision (Leitner). */
export async function calificarTarjeta(input: { tarjetaId: string; acierto: boolean }) {
  const usuarioId = await usuarioActual();
  const actual = await prisma.repasoTarjeta.findUnique({
    where: { usuarioId_tarjetaId: { usuarioId, tarjetaId: input.tarjetaId } },
  });
  const caja = siguienteCaja(actual?.caja ?? 1, input.acierto);
  const proxima = proximaFecha(caja);

  await prisma.repasoTarjeta.upsert({
    where: { usuarioId_tarjetaId: { usuarioId, tarjetaId: input.tarjetaId } },
    update: { caja, intervalo: INTERVALOS_DIAS[caja], proximaRevision: proxima, repeticiones: { increment: 1 } },
    create: {
      usuarioId,
      tarjetaId: input.tarjetaId,
      caja,
      intervalo: INTERVALOS_DIAS[caja],
      proximaRevision: proxima,
      repeticiones: 1,
    },
  });
  return { caja };
}

/** Registra un simulacro intercalado: actualiza estadisticas por pregunta. */
export async function registrarSimulacro(
  detalle: { preguntaId: string; correcto: boolean }[]
) {
  const usuarioId = await usuarioActual();
  const ahora = new Date();
  for (const d of detalle) {
    await prisma.estadisticaPregunta.upsert({
      where: { usuarioId_preguntaId: { usuarioId, preguntaId: d.preguntaId } },
      update: {
        vecesVista: { increment: 1 },
        vecesAcertada: d.correcto ? { increment: 1 } : undefined,
        vecesFallada: d.correcto ? undefined : { increment: 1 },
        ultima: ahora,
      },
      create: {
        usuarioId,
        preguntaId: d.preguntaId,
        vecesVista: 1,
        vecesAcertada: d.correcto ? 1 : 0,
        vecesFallada: d.correcto ? 0 : 1,
        ultima: ahora,
      },
    });
  }
  const total = detalle.length;
  const aciertos = detalle.filter((d) => d.correcto).length;
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;
  revalidatePath("/panel");
  return { porcentaje, aciertos, total };
}

/** Diagnostico inicial: puntua y recomienda por donde empezar. */
export async function registrarDiagnostico(
  detalle: { preguntaId: string; correcto: boolean }[]
) {
  const usuarioId = await usuarioActual();
  const total = detalle.length;
  const aciertos = detalle.filter((d) => d.correcto).length;
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;

  const recomendacion =
    porcentaje >= 80
      ? "Dominas las bases. Puedes empezar directamente por Fundamentos (Etapa 0) o Cimientos (Etapa 1)."
      : porcentaje >= 50
        ? "Buen punto de partida. Empieza por Cimientos (Etapa 1) y repasa un prerrequisito si algo se te complica."
        : "Te conviene arrancar por los Prerrequisitos (Etapa -1) para ir sobre seguro.";

  await prisma.diagnostico.create({
    data: { usuarioId, datos: { porcentaje, aciertos, total, recomendacion } },
  });
  revalidatePath("/panel");
  revalidatePath("/diagnostico");
  return { porcentaje, aciertos, total, recomendacion };
}
