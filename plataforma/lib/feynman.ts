import "server-only";
import { contextoTema } from "@/lib/tutor";
import { generarRespuestaTutor } from "@/lib/ai/proveedor";

/** Puntaje minimo (0..100) para dar por superado el reto Feynman. */
export const UMBRAL_FEYNMAN = 70;

/** Longitud minima de la explicacion (evita respuestas triviales). */
export const MIN_EXPLICACION = 120;

export type EvaluacionFeynman = {
  puntaje: number; // 0..100
  veredicto: string; // resumen corto
  fortalezas: string[];
  brechas: string[];
  sugerencias: string | null;
};

/** Instruccion de sistema para que el tutor evalue como examinador (devuelve JSON). */
function construirPromptEvaluacion(contexto?: string): string {
  return [
    "Eres el examinador de RutaFHIR, una plataforma para aprender el estandar HL7 FHIR.",
    "El estudiante debe explicar el tema con sus propias palabras (tecnica Feynman): como si se lo",
    "ensenara a un colega sin base tecnica. Tu tarea es evaluar SU explicacion, no dar clase.",
    "Evalua con rigor pero de forma justa y motivadora:",
    "- Premia la claridad, el uso de ejemplos propios y la conexion correcta de conceptos.",
    "- Penaliza la vaguedad, el copiar y pegar sin entender, los errores conceptuales y los huecos.",
    "- Si la explicacion es muy corta o generica, el puntaje debe ser bajo.",
    "Responde UNICAMENTE con un objeto JSON valido (sin texto extra, sin markdown, sin ```), con esta forma:",
    '{"puntaje": number 0-100, "veredicto": "una frase breve", "fortalezas": ["..."], "brechas": ["..."], "sugerencias": "que repasar o mejorar"}',
    "Escribe en espanol, claro y breve. No uses emojis. No inventes recursos ni campos de FHIR.",
    contexto ? `\nContexto del tema evaluado (referencia para juzgar la explicacion):\n${contexto}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Extrae y valida el JSON de la respuesta del modelo (tolerante a fences o texto extra). */
function parsearEvaluacion(texto: string): EvaluacionFeynman {
  const limpio = texto.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Toma el primer objeto {...} por si el modelo agrego texto alrededor.
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  const candidato = inicio >= 0 && fin > inicio ? limpio.slice(inicio, fin + 1) : limpio;

  try {
    const obj = JSON.parse(candidato) as Partial<EvaluacionFeynman>;
    const puntaje = Math.max(0, Math.min(100, Math.round(Number(obj.puntaje ?? 0))));
    const aArreglo = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 8) : [];
    return {
      puntaje: Number.isFinite(puntaje) ? puntaje : 0,
      veredicto: String(obj.veredicto ?? "").slice(0, 300) || "Evaluacion registrada.",
      fortalezas: aArreglo(obj.fortalezas),
      brechas: aArreglo(obj.brechas),
      sugerencias: obj.sugerencias ? String(obj.sugerencias).slice(0, 500) : null,
    };
  } catch {
    return {
      puntaje: 0,
      veredicto: "No se pudo evaluar la explicacion. Intenta de nuevo en un momento.",
      fortalezas: [],
      brechas: [],
      sugerencias: null,
    };
  }
}

/** Evalua la explicacion del estudiante para un tema usando el tutor IA. */
export async function evaluarExplicacionFeynman(
  temaSlug: string,
  explicacion: string
): Promise<EvaluacionFeynman> {
  const contexto = await contextoTema(temaSlug);
  const system = construirPromptEvaluacion(contexto);
  const r = await generarRespuestaTutor(
    system,
    [{ rol: "user", contenido: `Explicacion del estudiante:\n\n${explicacion}` }],
    { json: true }
  );
  return parsearEvaluacion(r.texto);
}
