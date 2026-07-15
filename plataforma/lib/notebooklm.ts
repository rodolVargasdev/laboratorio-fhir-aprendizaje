import "server-only";
import { prisma } from "@/lib/db";

type Enlace = { titulo: string; url: string; nota?: string };
type NotebookCfg = { nombreCuaderno?: string; fuentes?: string[]; prompts?: string[] };

/** Genera el paquete markdown de un tema para subir como fuente a NotebookLM. */
export async function generarPaqueteNotebookLM(slug: string): Promise<{ nombre: string; markdown: string } | null> {
  const tema = await prisma.tema.findUnique({
    where: { slug },
    include: {
      pasos: { where: { tipo: "LECTURA" }, take: 1 },
      preguntas: { orderBy: { orden: "asc" } },
    },
  });
  if (!tema) return null;

  const cfg = (tema.notebooklm as NotebookCfg | null) ?? {};
  const enlaces = (tema.enlaces as Enlace[] | null) ?? [];
  const leccion = tema.pasos[0]?.contenido ?? "";

  const partes: string[] = [];
  partes.push(`# ${tema.nombre}`);
  if (tema.resumen) partes.push(`> ${tema.resumen}`);

  partes.push(`\n## Lectura\n\n${leccion}`);

  if (tema.preguntas.length) {
    partes.push(`\n## Preguntas de repaso (con respuestas)\n`);
    tema.preguntas.forEach((p, i) => {
      let resp = "";
      if (p.tipo === "OPCION_MULTIPLE") {
        const ops = (p.opciones as string[] | null) ?? [];
        resp = ops[p.respuestaIndice ?? 0] ?? "";
      } else if (p.tipo === "VERDADERO_FALSO") {
        resp = p.respuestaBool ? "Verdadero" : "Falso";
      } else {
        resp = p.respuestasValidas[0] ?? "";
      }
      partes.push(`${i + 1}. **${p.enunciado}**\n   - Respuesta: ${resp}${p.explicacion ? `\n   - ${p.explicacion}` : ""}`);
    });
  }

  if (enlaces.length) {
    partes.push(`\n## Fuentes oficiales sugeridas\n`);
    enlaces.forEach((e) => partes.push(`- ${e.titulo}: ${e.url}`));
  }

  const prompts = cfg.prompts ?? [
    "Hazme un examen oral de 10 preguntas sobre este tema, de facil a dificil, sin darme las respuestas hasta que yo intente.",
    "Explica los 3 errores mas comunes de novato en este tema y por que lo son.",
    "Genera una guia de estudio con definiciones y ejemplos concretos basados solo en las fuentes.",
  ];
  partes.push(`\n## Prompts sugeridos para NotebookLM\n`);
  prompts.forEach((p) => partes.push(`- ${p}`));

  return {
    nombre: cfg.nombreCuaderno ?? `FHIR — ${tema.nombre}`,
    markdown: partes.join("\n"),
  };
}
