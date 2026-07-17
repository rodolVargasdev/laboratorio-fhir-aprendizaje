import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type MensajeChat = { rol: "user" | "assistant"; contenido: string };

export type RespuestaTutor = { texto: string; proveedor: string };

/** Opciones de generacion. `json: true` pide al modelo una respuesta JSON pura
 *  (util para evaluaciones estructuradas como el reto Feynman). */
export type OpcionesGeneracion = { json?: boolean };

// Lista de modelos Gemini a intentar en orden (resiliencia ante 429/503 del free tier).
// gemini-2.0-flash suele quedarse sin cuota gratis; 2.5-flash y lite funcionan mejor.
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
].filter(Boolean) as string[];

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/** Genera una respuesta del tutor probando Gemini (varios modelos) -> Groq -> (dev) eco. */
export async function generarRespuestaTutor(
  system: string,
  mensajes: MensajeChat[],
  opciones: OpcionesGeneracion = {}
): Promise<RespuestaTutor> {
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const contents = mensajes.map((m) => ({
      role: m.rol === "assistant" ? "model" : "user",
      parts: [{ text: m.contenido }],
    }));
    const generationConfig = opciones.json
      ? { responseMimeType: "application/json" }
      : undefined;
    let ultimoError: unknown;
    for (const modelo of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelo,
          systemInstruction: system,
          generationConfig,
        });
        const res = await model.generateContent({ contents });
        const texto = res.response.text();
        if (texto?.trim()) return { texto, proveedor: `gemini:${modelo}` };
      } catch (e) {
        ultimoError = e;
        // 429 (cuota) o 503 (sobrecarga) -> probar el siguiente modelo.
      }
    }
    console.error("[tutor] Gemini fallo en todos los modelos:", ultimoError);
  }

  if (process.env.GROQ_API_KEY) {
    try {
      return { texto: await conGroq(system, mensajes, opciones), proveedor: "groq" };
    } catch (e) {
      console.error("[tutor] Groq fallo:", e);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return { texto: ecoDesarrollo(mensajes), proveedor: "dev-eco" };
  }
  throw new Error("El tutor no esta disponible (todos los proveedores fallaron).");
}

async function conGroq(
  system: string,
  mensajes: MensajeChat[],
  opciones: OpcionesGeneracion = {}
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: system }, ...mensajes.map((m) => ({ role: m.rol, content: m.contenido }))],
      temperature: 0.4,
      ...(opciones.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

/** Respuesta simulada para desarrollo sin claves (no llama a ningun servicio). */
function ecoDesarrollo(mensajes: MensajeChat[]): string {
  const ultima = [...mensajes].reverse().find((m) => m.rol === "user")?.contenido ?? "";
  return [
    "(Tutor en modo desarrollo - sin clave de IA configurada.)",
    "",
    `Buena pregunta. Antes de responderte, pensemos juntos: sobre "${ultima.slice(0, 80)}", ` +
      "que parte crees que es la clave?",
    "",
    "Cuando configures GEMINI_API_KEY, aqui veras la respuesta real del tutor.",
  ].join("\n");
}
