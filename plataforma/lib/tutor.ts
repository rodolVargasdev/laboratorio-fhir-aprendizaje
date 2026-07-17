import "server-only";
import { prisma } from "@/lib/db";

/** Instruccion de sistema: tutor socratico, principiante, en espanol, que cita fuentes. */
export function construirSystemPrompt(contextoTema?: string): string {
  return [
    "Eres el tutor de RutaFHIR, una plataforma para aprender el estandar HL7 FHIR.",
    "Tu estudiante puede tener poca base tecnica (por ejemplo, un estadistico o un entusiasta de la informatica). Se paciente y cercano.",
    "Reglas:",
    "- Responde SIEMPRE en espanol, claro y breve (max ~180 palabras).",
    "- Metodo socratico: no des la respuesta completa de inmediato. Primero una pista o una pregunta guia; si el estudiante insiste o falla, entonces explica.",
    "- Usa analogias simples y ejemplos concretos.",
    "- Si mencionas detalles tecnicos de FHIR, remite a la documentacion oficial (hl7.org/fhir) y NO inventes nombres de recursos, campos ni operaciones. Si no estas seguro, dilo.",
    "- No uses emojis.",
    contextoTema ? `\nContexto del tema que el estudiante esta viendo:\n${contextoTema}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Contexto compacto de un tema (nombre, objetivos y lectura recortada) para el prompt. */
export async function contextoTema(slug: string): Promise<string | undefined> {
  const tema = await prisma.tema.findUnique({
    where: { slug },
    include: { pasos: { where: { tipo: "LECTURA" }, take: 1 } },
  });
  if (!tema) return undefined;
  const leccion = (tema.pasos[0]?.contenido ?? "").slice(0, 1500);
  const objetivos = tema.objetivos.length ? `Objetivos: ${tema.objetivos.join("; ")}.` : "";
  return [`Tema: ${tema.nombre}.`, tema.resumen, objetivos, leccion].filter(Boolean).join("\n");
}
