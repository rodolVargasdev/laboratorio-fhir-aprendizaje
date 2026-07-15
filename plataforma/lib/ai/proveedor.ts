import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type MensajeChat = { rol: "user" | "assistant"; contenido: string };

export type RespuestaTutor = { texto: string; proveedor: string };

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/** Genera una respuesta del tutor probando Gemini -> Groq -> (dev) eco. */
export async function generarRespuestaTutor(
  system: string,
  mensajes: MensajeChat[]
): Promise<RespuestaTutor> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return { texto: await conGemini(system, mensajes), proveedor: "gemini" };
    } catch (e) {
      console.error("[tutor] Gemini fallo, intento fallback:", e);
    }
  }
  if (process.env.GROQ_API_KEY) {
    try {
      return { texto: await conGroq(system, mensajes), proveedor: "groq" };
    } catch (e) {
      console.error("[tutor] Groq fallo:", e);
    }
  }
  if (process.env.NODE_ENV !== "production") {
    return { texto: ecoDesarrollo(mensajes), proveedor: "dev-eco" };
  }
  throw new Error("El tutor no esta configurado (falta GEMINI_API_KEY).");
}

async function conGemini(system: string, mensajes: MensajeChat[]): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
  });
  const contents = mensajes.map((m) => ({
    role: m.rol === "assistant" ? "model" : "user",
    parts: [{ text: m.contenido }],
  }));
  const res = await model.generateContent({ contents });
  return res.response.text();
}

async function conGroq(system: string, mensajes: MensajeChat[]): Promise<string> {
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
    "(Tutor en modo desarrollo — sin clave de IA configurada.)",
    "",
    `Buena pregunta. Antes de responderte, pensemos juntos: sobre "${ultima.slice(0, 80)}", ` +
      "que parte crees que es la clave?",
    "",
    "Cuando configures GEMINI_API_KEY, aqui veras la respuesta real del tutor.",
  ].join("\n");
}
