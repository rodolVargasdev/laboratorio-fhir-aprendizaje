import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generarRespuestaTutor, type MensajeChat } from "@/lib/ai/proveedor";
import { construirSystemPrompt, contextoTema } from "@/lib/tutor";
import { estadoLimiteTutor } from "@/lib/limite-tutor";

const Body = z.object({
  mensaje: z.string().min(1).max(2000),
  temaSlug: z.string().optional(),
  conversacionId: z.string().optional(),
});

/** Estado del limite diario del tutor para el usuario actual (para mostrarlo en la UI). */
export async function GET() {
  const sesion = await auth();
  if (!sesion?.user?.id) return new Response("No autorizado", { status: 401 });
  const limite = await estadoLimiteTutor(sesion.user.id);
  return Response.json(limite);
}

export async function POST(req: Request) {
  const sesion = await auth();
  if (!sesion?.user?.id) return new Response("No autorizado", { status: 401 });
  const usuarioId = sesion.user.id;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Solicitud invalida" }, { status: 400 });
  const { mensaje, temaSlug, conversacionId } = parsed.data;

  // Limite diario proporcional al numero de usuarios (protege el free tier de la IA).
  const limite = await estadoLimiteTutor(usuarioId);
  if (limite.restantes <= 0) {
    return Response.json(
      {
        error: `Alcanzaste tu limite de ${limite.limite} preguntas al tutor por hoy. Vuelve manana.`,
        limite,
      },
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

  // Estado del limite tras registrar esta pregunta (para que la UI lo muestre al dia).
  const limiteActual = await estadoLimiteTutor(usuarioId);

  return Response.json({ conversacionId: conversacion.id, respuesta, limite: limiteActual });
}
