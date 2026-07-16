import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generarRespuestaTutor, type MensajeChat } from "@/lib/ai/proveedor";
import {
  construirSystemPrompt,
  contextoTema,
  mensajesUltimaHora,
  LIMITE_MENSAJES_HORA,
} from "@/lib/tutor";

const Body = z.object({
  mensaje: z.string().min(1).max(2000),
  temaSlug: z.string().optional(),
  conversacionId: z.string().optional(),
});

export async function POST(req: Request) {
  const sesion = await auth();
  if (!sesion?.user?.id) return new Response("No autorizado", { status: 401 });
  const usuarioId = sesion.user.id;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Solicitud invalida" }, { status: 400 });
  const { mensaje, temaSlug, conversacionId } = parsed.data;

  // Rate limit (protege el free tier de la IA).
  if ((await mensajesUltimaHora(usuarioId)) >= LIMITE_MENSAJES_HORA) {
    return Response.json(
      { error: "Alcanzaste el limite de preguntas por hora. Intenta mas tarde." },
      { status: 429 }
    );
  }

  // Conversacion (existente del usuario o nueva).
  let conversacion =
    conversacionId
      ? await prisma.conversacionTutor.findFirst({ where: { id: conversacionId, usuarioId } })
      : null;

  if (!conversacion) {
    let temaId: string | undefined;
    if (temaSlug) {
      const t = await prisma.tema.findUnique({ where: { slug: temaSlug }, select: { id: true } });
      temaId = t?.id;
    }
    conversacion = await prisma.conversacionTutor.create({
      data: { usuarioId, temaId, titulo: mensaje.slice(0, 60) },
    });
  }

  // Historial reciente (para contexto conversacional).
  const previos = await prisma.mensajeTutor.findMany({
    where: { conversacionId: conversacion.id },
    orderBy: { creado: "asc" },
    take: 20,
  });

  await prisma.mensajeTutor.create({
    data: { conversacionId: conversacion.id, rol: "user", contenido: mensaje },
  });

  const historial: MensajeChat[] = previos
    .filter((m) => m.rol === "user" || m.rol === "assistant")
    .map((m) => ({ rol: m.rol as "user" | "assistant", contenido: m.contenido }));
  historial.push({ rol: "user", contenido: mensaje });

  const contexto = temaSlug ? await contextoTema(temaSlug) : undefined;
  const system = construirSystemPrompt(contexto);

  let respuesta: string;
  try {
    const r = await generarRespuestaTutor(system, historial);
    respuesta = r.texto;
  } catch (e) {
    console.error("[tutor] error generando respuesta:", e);
    return Response.json(
      { error: "El tutor no esta disponible ahora mismo." },
      { status: 503 }
    );
  }

  await prisma.mensajeTutor.create({
    data: { conversacionId: conversacion.id, rol: "assistant", contenido: respuesta },
  });

  return Response.json({ conversacionId: conversacion.id, respuesta });
}
