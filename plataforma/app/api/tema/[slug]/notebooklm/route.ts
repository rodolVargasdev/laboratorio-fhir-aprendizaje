import { auth } from "@/auth";
import { generarPaqueteNotebookLM } from "@/lib/notebooklm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const sesion = await auth();
  if (!sesion?.user) return new Response("No autorizado", { status: 401 });

  const { slug } = await params;
  const paquete = await generarPaqueteNotebookLM(slug);
  if (!paquete) return new Response("Tema no encontrado", { status: 404 });

  const archivo = `${slug}-notebooklm.md`;
  return new Response(paquete.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${archivo}"`,
    },
  });
}
