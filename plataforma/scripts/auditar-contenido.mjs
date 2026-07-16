// Auditoria rigurosa del contenido de /contenido. Solo lectura.
// Uso: node scripts/auditar-contenido.mjs
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..", "contenido");
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const TIPOS = new Set(["opcion_multiple", "verdadero_falso", "respuesta_corta"]);

const problemas = [];
const avisos = [];
const stats = [];
const idsGlobal = new Map();

function err(t, m) { problemas.push(`[${t}] ${m}`); }
function warn(t, m) { avisos.push(`[${t}] ${m}`); }

const curriculo = JSON.parse(fs.readFileSync(path.join(RAIZ, "curriculo.json"), "utf8"));
const temasEsperados = curriculo.etapas.flatMap((e) => e.temas); // "etapa/slug"

for (const rel of temasEsperados) {
  const dir = path.join(RAIZ, "etapas", rel);
  const slug = rel.split("/")[1];
  if (!fs.existsSync(dir)) { err(slug, `directorio no existe: ${rel}`); continue; }

  const leer = (f) => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null; };
  const st = { slug, palabras: 0, quiz: 0, tarjetas: 0 };

  // --- leccion.md ---
  const lec = leer("leccion.md");
  if (!lec) err(slug, "falta leccion.md");
  else {
    st.palabras = lec.trim().split(/\s+/).length;
    if (EMOJI.test(lec)) err(slug, "leccion.md contiene emoji");
    // Cuenta encabezados ignorando bloques de codigo (``` ... ```), donde `#` es comentario.
    const sinCodigo = lec.replace(/```[\s\S]*?```/g, "");
    const h1 = (sinCodigo.match(/^# .+/gm) || []).length;
    if (h1 !== 1) err(slug, `leccion.md debe tener exactamente un H1 (tiene ${h1})`);
    if (!/^>\s*\*\*En simple/m.test(lec)) warn(slug, "leccion.md sin recuadro 'En simple'");
    const h2 = (lec.match(/^## .+/gm) || []).length;
    if (h2 < 5) err(slug, `leccion.md tiene pocas secciones ## (${h2})`);
    if (!/^##\s+.*[Aa]utoevaluaci/m.test(lec)) warn(slug, "leccion.md sin Autoevaluacion");
    if (!/^###\s+Respuestas/m.test(lec)) warn(slug, "leccion.md sin '### Respuestas'");
    if (!/[Pp]ara profundizar/m.test(lec)) warn(slug, "leccion.md sin 'Para profundizar'");
    if (st.palabras < 1800 && !slug.startsWith("prerreq-00")) warn(slug, `leccion corta (${st.palabras} palabras)`);
    // enlaces http rotos de formato
    const urls = [...lec.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    for (const u of urls) if (/\s/.test(u)) err(slug, `URL con espacio en leccion: ${u}`);
  }

  // --- practica.md ---
  const pr = leer("practica.md");
  if (!pr) err(slug, "falta practica.md");
  else if (EMOJI.test(pr)) err(slug, "practica.md contiene emoji");

  // --- quiz.json ---
  const quizRaw = leer("quiz.json");
  if (!quizRaw) err(slug, "falta quiz.json");
  else {
    let q;
    try { q = JSON.parse(quizRaw); } catch (e) { err(slug, `quiz.json invalido: ${e.message}`); q = null; }
    if (q) {
      if (EMOJI.test(quizRaw)) err(slug, "quiz.json contiene emoji");
      if (!Array.isArray(q.preguntas)) err(slug, "quiz.json sin array preguntas");
      else {
        st.quiz = q.preguntas.length;
        if (q.preguntas.length < 12) warn(slug, `pocas preguntas (${q.preguntas.length})`);
        q.preguntas.forEach((p, i) => {
          const donde = `${slug} q#${i + 1}(${p.id ?? "sin-id"})`;
          if (!p.id) err(slug, `pregunta ${i + 1} sin id`);
          else {
            if (idsGlobal.has(p.id)) err(slug, `id duplicado GLOBAL: ${p.id} (tambien en ${idsGlobal.get(p.id)})`);
            idsGlobal.set(p.id, slug);
          }
          if (!TIPOS.has(p.tipo)) err(slug, `${donde} tipo invalido: ${p.tipo}`);
          if (!p.pregunta || !p.pregunta.trim()) err(slug, `${donde} sin enunciado`);
          if (!p.explicacion) warn(slug, `${donde} sin explicacion`);
          if (p.tipo === "opcion_multiple") {
            if (!Array.isArray(p.opciones) || p.opciones.length < 2) err(slug, `${donde} opciones invalidas`);
            else if (typeof p.respuesta !== "number" || p.respuesta < 0 || p.respuesta >= p.opciones.length)
              err(slug, `${donde} respuesta fuera de rango: ${p.respuesta} (de ${p.opciones.length})`);
          } else if (p.tipo === "verdadero_falso") {
            if (typeof p.respuesta !== "boolean") err(slug, `${donde} respuesta no booleana`);
          } else if (p.tipo === "respuesta_corta") {
            if (!Array.isArray(p.respuestas_validas) || p.respuestas_validas.length === 0)
              err(slug, `${donde} sin respuestas_validas`);
          }
        });
      }
    }
  }

  // --- tarjetas.json ---
  const tarRaw = leer("tarjetas.json");
  if (!tarRaw) err(slug, "falta tarjetas.json");
  else {
    let t;
    try { t = JSON.parse(tarRaw); } catch (e) { err(slug, `tarjetas.json invalido: ${e.message}`); t = null; }
    if (t) {
      if (EMOJI.test(tarRaw)) err(slug, "tarjetas.json contiene emoji");
      if (!Array.isArray(t)) err(slug, "tarjetas.json no es array");
      else {
        st.tarjetas = t.length;
        if (t.length < 8) warn(slug, `pocas tarjetas (${t.length})`);
        t.forEach((c, i) => { if (!c.frente || !c.reverso) err(slug, `tarjeta ${i + 1} incompleta`); });
      }
    }
  }

  // --- tema.json ---
  const temaRaw = leer("tema.json");
  if (!temaRaw) err(slug, "falta tema.json");
  else {
    let tj;
    try { tj = JSON.parse(temaRaw); } catch (e) { err(slug, `tema.json invalido: ${e.message}`); tj = null; }
    if (tj) {
      if (tj.slug !== slug) err(slug, `tema.json slug no coincide: ${tj.slug}`);
      if (typeof tj.numero !== "number") err(slug, "tema.json sin numero");
      if (!Array.isArray(tj.objetivos) || tj.objetivos.length < 4) warn(slug, "tema.json pocos objetivos");
      if (!Array.isArray(tj.enlaces) || tj.enlaces.length < 3) warn(slug, "tema.json pocos enlaces");
      const nb = tj.notebooklm;
      if (!nb || !Array.isArray(nb.fuentes) || nb.fuentes.length < 2) warn(slug, "tema.json notebooklm sin fuentes");
      else nb.fuentes.forEach((f) => { if (!f.url || !/^https?:\/\//.test(f.url)) err(slug, `fuente notebooklm sin URL valida: ${JSON.stringify(f)}`); });
    }
  }

  stats.push(st);
}

// notebooklm.md por tema
for (const rel of temasEsperados) {
  const p = path.join(RAIZ, "etapas", rel, "notebooklm.md");
  if (!fs.existsSync(p)) warn(rel.split("/")[1], "falta notebooklm.md");
}

console.log("=== ESTADISTICAS POR TEMA ===");
for (const s of stats) console.log(`  ${s.slug.padEnd(28)} L=${String(s.palabras).padStart(4)}  quiz=${String(s.quiz).padStart(2)}  tarjetas=${String(s.tarjetas).padStart(2)}`);
console.log(`\n  Total temas: ${stats.length} | preguntas: ${stats.reduce((a, s) => a + s.quiz, 0)} | tarjetas: ${stats.reduce((a, s) => a + s.tarjetas, 0)} | ids unicos: ${idsGlobal.size}`);

console.log(`\n=== PROBLEMAS (${problemas.length}) ===`);
problemas.forEach((p) => console.log("  X " + p));
console.log(`\n=== AVISOS (${avisos.length}) ===`);
avisos.forEach((a) => console.log("  ! " + a));
console.log(problemas.length === 0 ? "\nAUDITORIA: sin problemas criticos." : `\nAUDITORIA: ${problemas.length} problemas criticos.`);
process.exit(problemas.length ? 1 : 0);
