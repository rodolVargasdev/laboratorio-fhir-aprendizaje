/**
 * Siembra el contenido de /contenido a Postgres.
 * Uso:  npm run db:seed
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type TipoPregunta } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CONTENIDO = path.resolve(import.meta.dirname, "..", "contenido");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Curriculo = {
  etapas: {
    numero: number;
    slug: string;
    nombre: string;
    meta: string;
    orden: number;
    temas: string[]; // "<etapaSlug>/<temaSlug>"
  }[];
};

type TemaMeta = {
  slug: string;
  numero: number;
  nombre: string;
  resumen?: string;
  opcional?: boolean;
  objetivos?: string[];
  enlaces?: unknown[];
  notebooklm?: unknown;
};

type PreguntaLegacy = {
  id?: string;
  tipo: string;
  pregunta: string;
  opciones?: string[];
  respuesta?: number | boolean;
  respuestas_validas?: string[];
  explicacion?: string;
  bloom?: string;
};

function leer(rel: string): string {
  const p = path.join(CONTENIDO, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
function leerJSON<T>(rel: string, fallback: T): T {
  const p = path.join(CONTENIDO, rel);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function mapTipo(t: string): TipoPregunta {
  if (t === "verdadero_falso") return "VERDADERO_FALSO";
  if (t === "respuesta_corta") return "RESPUESTA_CORTA";
  return "OPCION_MULTIPLE";
}

async function sembrarTema(etapaId: string, dirRel: string, orden: number) {
  const base = path.join("etapas", dirRel);
  const meta = leerJSON<TemaMeta | null>(path.join(base, "tema.json"), null);
  if (!meta) {
    console.warn(`  [aviso] sin tema.json en ${dirRel}`);
    return;
  }

  const tema = await prisma.tema.upsert({
    where: { slug: meta.slug },
    update: {
      etapaId,
      numero: meta.numero,
      nombre: meta.nombre,
      resumen: meta.resumen ?? null,
      opcional: !!meta.opcional,
      orden,
      objetivos: meta.objetivos ?? [],
      enlaces: (meta.enlaces ?? []) as object,
      notebooklm: (meta.notebooklm ?? {}) as object,
    },
    create: {
      slug: meta.slug,
      etapaId,
      numero: meta.numero,
      nombre: meta.nombre,
      resumen: meta.resumen ?? null,
      opcional: !!meta.opcional,
      orden,
      objetivos: meta.objetivos ?? [],
      enlaces: (meta.enlaces ?? []) as object,
      notebooklm: (meta.notebooklm ?? {}) as object,
    },
  });

  // Pasos (secuencia fija de la "clase"). PRACTICA_NACIONAL solo si existe el archivo.
  const leccion = leer(path.join(base, "leccion.md"));
  const notebooklm = leer(path.join(base, "notebooklm.md"));
  const practica = leer(path.join(base, "practica.md"));
  const practicaNacional = leer(path.join(base, "practica-nacional.md"));

  const pasos: { tipo: "LECTURA" | "NOTEBOOKLM" | "PRACTICA" | "QUIZ" | "PRACTICA_NACIONAL" | "TARJETAS"; titulo: string; contenido: string | null; orden: number }[] = [
    { tipo: "LECTURA", titulo: "Lectura", contenido: leccion || null, orden: 1 },
    { tipo: "NOTEBOOKLM", titulo: "NotebookLM (obligatorio)", contenido: notebooklm || null, orden: 2 },
    { tipo: "PRACTICA", titulo: "Practica en la PC", contenido: practica || null, orden: 3 },
    { tipo: "QUIZ", titulo: "Quiz del tema", contenido: null, orden: 4 },
  ];
  if (practicaNacional) {
    pasos.push({ tipo: "PRACTICA_NACIONAL", titulo: "Practica nacional", contenido: practicaNacional, orden: 5 });
  }
  pasos.push({ tipo: "TARJETAS", titulo: "Tarjetas de repaso", contenido: null, orden: 6 });

  for (const paso of pasos) {
    await prisma.paso.upsert({
      where: { temaId_tipo: { temaId: tema.id, tipo: paso.tipo } },
      update: { titulo: paso.titulo, contenido: paso.contenido, orden: paso.orden },
      create: { temaId: tema.id, tipo: paso.tipo, titulo: paso.titulo, contenido: paso.contenido, orden: paso.orden },
    });
  }

  // Preguntas (reemplazo completo para idempotencia).
  const quiz = leerJSON<{ preguntas?: PreguntaLegacy[] }>(path.join(base, "quiz.json"), { preguntas: [] });
  await prisma.pregunta.deleteMany({ where: { temaId: tema.id } });
  const preguntas = quiz.preguntas ?? [];
  for (let i = 0; i < preguntas.length; i++) {
    const p = preguntas[i];
    const tipo = mapTipo(p.tipo);
    await prisma.pregunta.create({
      data: {
        temaId: tema.id,
        claveLegacy: p.id ?? null,
        tipo,
        enunciado: p.pregunta,
        opciones: tipo === "OPCION_MULTIPLE" ? (p.opciones ?? []) : undefined,
        respuestaIndice: tipo === "OPCION_MULTIPLE" ? (p.respuesta as number) : null,
        respuestaBool: tipo === "VERDADERO_FALSO" ? (p.respuesta as boolean) : null,
        respuestasValidas: tipo === "RESPUESTA_CORTA" ? (p.respuestas_validas ?? []) : [],
        explicacion: p.explicacion ?? null,
        bloom: p.bloom ?? null,
        orden: i + 1,
      },
    });
  }

  // Tarjetas (reemplazo completo).
  const tarjetas = leerJSON<{ claveLegacy?: string; frente: string; reverso: string }[]>(path.join(base, "tarjetas.json"), []);
  await prisma.tarjeta.deleteMany({ where: { temaId: tema.id } });
  for (const t of tarjetas) {
    await prisma.tarjeta.create({
      data: { temaId: tema.id, claveLegacy: t.claveLegacy ?? null, frente: t.frente, reverso: t.reverso },
    });
  }

  return { temaId: tema.id, nPreguntas: preguntas.length, nTarjetas: tarjetas.length };
}

async function main() {
  const curriculo = leerJSON<Curriculo>("curriculo.json", { etapas: [] });
  let totalTemas = 0,
    totalPreg = 0,
    totalTar = 0;

  for (const etapa of curriculo.etapas) {
    const e = await prisma.etapa.upsert({
      where: { slug: etapa.slug },
      update: { numero: etapa.numero, nombre: etapa.nombre, meta: etapa.meta, orden: etapa.orden },
      create: { slug: etapa.slug, numero: etapa.numero, nombre: etapa.nombre, meta: etapa.meta, orden: etapa.orden },
    });
    for (let i = 0; i < etapa.temas.length; i++) {
      const r = await sembrarTema(e.id, etapa.temas[i], i + 1);
      if (r) {
        totalTemas++;
        totalPreg += r.nPreguntas;
        totalTar += r.nTarjetas;
      }
    }
  }

  console.log(`OK -> sembrado`);
  console.log(`  etapas: ${curriculo.etapas.length} | temas: ${totalTemas} | preguntas: ${totalPreg} | tarjetas: ${totalTar}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
