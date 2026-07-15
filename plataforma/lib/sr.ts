import "server-only";
import { prisma } from "@/lib/db";

// Repeticion espaciada con cajas de Leitner. Intervalos (dias) por caja 1..5.
export const INTERVALOS_DIAS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };
export const CAJA_MAX = 5;

/** Nueva caja tras una revision (acierto sube, fallo vuelve a 1). */
export function siguienteCaja(caja: number, acierto: boolean): number {
  if (!acierto) return 1;
  return Math.min(caja + 1, CAJA_MAX);
}

/** Fecha de la proxima revision dado el numero de caja. */
export function proximaFecha(caja: number, desde = new Date()): Date {
  const dias = INTERVALOS_DIAS[caja] ?? 1;
  return new Date(desde.getTime() + dias * 24 * 60 * 60 * 1000);
}

export type TarjetaPendiente = {
  id: string;
  frente: string;
  reverso: string;
  temaNombre: string;
  caja: number;
};

/** Tarjetas que tocan hoy (sin repaso previo o con proximaRevision <= ahora). */
export async function tarjetasPendientes(
  usuarioId: string,
  opts: { temaSlug?: string; limite?: number } = {}
): Promise<TarjetaPendiente[]> {
  const ahora = new Date();
  const tarjetas = await prisma.tarjeta.findMany({
    where: opts.temaSlug ? { tema: { slug: opts.temaSlug } } : {},
    include: {
      tema: { select: { nombre: true } },
      repasos: { where: { usuarioId } },
    },
  });

  const pendientes = tarjetas
    .map((t) => {
      const r = t.repasos[0];
      return {
        id: t.id,
        frente: t.frente,
        reverso: t.reverso,
        temaNombre: t.tema.nombre,
        caja: r?.caja ?? 1,
        due: !r || r.proximaRevision <= ahora,
      };
    })
    .filter((t) => t.due);

  const lista = pendientes.map(({ due, ...rest }) => rest);
  return opts.limite ? lista.slice(0, opts.limite) : lista;
}

/** Resumen de cajas y pendientes para el tablero de repaso. */
export async function resumenRepaso(usuarioId: string) {
  const ahora = new Date();
  const [total, repasos] = await Promise.all([
    prisma.tarjeta.count(),
    prisma.repasoTarjeta.findMany({ where: { usuarioId } }),
  ]);

  const porCaja = [0, 0, 0, 0, 0, 0]; // indice 1..5
  let vistas = 0;
  let pendientesConRepaso = 0;
  for (const r of repasos) {
    porCaja[r.caja] = (porCaja[r.caja] ?? 0) + 1;
    vistas++;
    if (r.proximaRevision <= ahora) pendientesConRepaso++;
  }
  const nuevas = total - vistas; // sin repaso => pendientes
  const pendientes = nuevas + pendientesConRepaso;

  return { total, porCaja, pendientes, nuevas };
}
