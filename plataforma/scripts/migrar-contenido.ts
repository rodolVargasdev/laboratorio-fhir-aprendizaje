/**
 * Migra el contenido del laboratorio original a la carpeta /contenido de la
 * plataforma (fuente de verdad editable, que luego se siembra a Postgres).
 *
 * Lee del repo raiz: evaluacion/temas.json (mapa), movil/*.md (lecturas),
 * dias/ * /quiz.json (quizzes), evaluacion/flashcards.json (tarjetas),
 * PRACTICAS-NACIONALES.md (practica institucional) y dias/ * /README.md (practica PC).
 *
 * Uso:  npx tsx scripts/migrar-contenido.ts
 */
import fs from "node:fs";
import path from "node:path";

const SCRIPT_DIR = import.meta.dirname;
// El material original se archivo en /legacy; este script queda como referencia historica.
const RAIZ = path.resolve(SCRIPT_DIR, "..", "..", "legacy");
const CONTENIDO = path.resolve(SCRIPT_DIR, "..", "contenido");

function leer(rel: string): string {
  const p = path.join(RAIZ, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
function leerJSON<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, rel), "utf8")) as T;
}
function escribir(relDir: string, archivo: string, contenido: string) {
  const dir = path.join(CONTENIDO, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, archivo), contenido, "utf8");
}

// --- Mapa de nuevas etapas (de lo general a lo especifico) ---
const ETAPAS = [
  { numero: -1, slug: "prerrequisitos", nombre: "Prerrequisitos: bases digitales", meta: "Antes de FHIR: terminal, JSON, APIs, Python y SQL en version minima y amable.", orden: 0 },
  { numero: 0, slug: "fundamentos", nombre: "Fundamentos e historia de FHIR", meta: "Por que existe FHIR: de HL7 v2/v3 a R4, Argonaut y SMART.", orden: 1 },
  { numero: 1, slug: "cimientos", nombre: "Cimientos", meta: "Leer y hablar el idioma de FHIR: JSON/XML, HTTP/REST y seguridad basica.", orden: 2 },
  { numero: 2, slug: "estandar", nombre: "El estandar FHIR", meta: "Modelo de recursos, busqueda, terminologias y validacion (nucleo del examen).", orden: 3 },
  { numero: 3, slug: "practica-real", nombre: "Practica real", meta: "FHIR en Google Cloud, SMART en practica y proyecto integrador.", orden: 4 },
];

// Legacy tema.id -> etapa slug nueva
const TEMA_A_ETAPA: Record<number, string> = {
  0: "fundamentos",
  1: "cimientos",
  2: "cimientos",
  3: "cimientos",
  4: "estandar",
  5: "estandar",
  6: "estandar",
  7: "estandar",
  8: "practica-real",
  9: "practica-real",
  10: "practica-real",
};

type TemaLegacy = {
  id: number;
  etapa: number;
  slug: string;
  nombre: string;
  opcional: boolean;
  dias: (number | string)[];
  movil: string;
  resumen: string;
  practica_institucional: string;
};
type TemasJSON = { temas: TemaLegacy[] };
type Flashcard = { id: string; dia: number | string; frente: string; reverso: string };

function seccionPracticaNacional(temaId: number): string {
  const texto = leer("PRACTICAS-NACIONALES.md");
  if (!texto) return "";
  const lineas = texto.split(/\r?\n/);
  let capturando = false;
  const cuerpo: string[] = [];
  for (const linea of lineas) {
    const m = linea.match(/^## Tema (\d+)\b/);
    if (m) {
      if (capturando) break;
      if (Number(m[1]) === temaId) {
        capturando = true;
        cuerpo.push(linea);
        continue;
      }
    } else if (capturando && (linea.startsWith("# ") || linea.trim() === "---")) {
      break;
    }
    if (capturando) cuerpo.push(linea);
  }
  return cuerpo.join("\n").trim();
}

function practicaPCDesdeDias(dias: (number | string)[]): string {
  const bloques: string[] = [];
  for (const d of dias) {
    const dir = typeof d === "number" ? `dia-${String(d).padStart(2, "0")}` : String(d);
    let readme = leer(`dias/${dir}/README.md`);
    if (!readme) continue;
    // Quitar el bloque "Prompt para Composer" (el tutor ahora va integrado).
    const idx = readme.search(/^##+\s*Prompt para Composer/im);
    if (idx >= 0) readme = readme.slice(0, idx).trim();
    bloques.push(readme);
  }
  return bloques.join("\n\n---\n\n").trim();
}

function checklistNotebookLM(tema: TemaLegacy): string {
  return `# NotebookLM — ${tema.nombre}

> Paso obligatorio. Llevar el material de este tema a un cuaderno de NotebookLM
> consolida lo aprendido (audio, preguntas y mapa mental). Marca cada casilla al
> completarla; el tema no se cierra sin este paso.

## Pasos

- [ ] Abrir [notebooklm.google.com](https://notebooklm.google.com) con tu cuenta Google.
- [ ] Crear un cuaderno nuevo llamado: **FHIR — ${tema.nombre}**.
- [ ] Subir la lectura de este tema como fuente (usa el boton "Exportar para NotebookLM").
- [ ] Anadir 2 a 4 enlaces oficiales del tema como fuentes adicionales.
- [ ] Generar el **Audio Overview** y escucharlo una vez.
- [ ] Pedirle al cuaderno un **examen oral de 10 preguntas** y responderlo sin mirar.

## Prompts sugeridos

- "Hazme un examen oral de 10 preguntas sobre este tema, de facil a dificil, sin darme las respuestas hasta que yo intente."
- "Explica los 3 errores mas comunes de novato en este tema y por que lo son."
- "Genera una guia de estudio con definiciones y ejemplos concretos basados solo en las fuentes."
`;
}

function checklistNotebookLMSimple(nombre: string): string {
  return `# NotebookLM — ${nombre}

> Paso obligatorio. Consolida el tema en un cuaderno de NotebookLM.

## Pasos

- [ ] Abrir [notebooklm.google.com](https://notebooklm.google.com) con tu cuenta Google.
- [ ] Crear un cuaderno: **Bases — ${nombre}**.
- [ ] Subir la lectura de este tema como fuente.
- [ ] Generar el Audio Overview y escucharlo.
- [ ] Pedir un examen oral de 8 preguntas y responderlo sin mirar.
`;
}

type Prerreq = {
  slug: string;
  numero: number;
  nombre: string;
  resumen: string;
  objetivos: string[];
  enlaces: { titulo: string; url: string; nota?: string }[];
  leccion: string;
  practica: string;
  preguntas: unknown[];
  tarjetas: { frente: string; reverso: string }[];
};

const PRERREQUISITOS: Prerreq[] = [
  {
    slug: "prerreq-00-terminal",
    numero: -15,
    nombre: "La terminal y tu entorno",
    resumen: "Que es la terminal, como abrirla y como corres los comandos del curso.",
    objetivos: ["Abrir una terminal", "Entender que es un comando", "Copiar y pegar comandos con confianza"],
    enlaces: [{ titulo: "Que es la linea de comandos (MDN)", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Command_line" }],
    leccion: `# La terminal y tu entorno

> **En simple:** la terminal es una ventana donde le escribes ordenes a la
> computadora en texto, en vez de hacer clic. No hay que memorizar nada: en el
> curso copias y pegas los comandos, y el tutor te acompana.

## Como abrirla

- **Windows:** busca "PowerShell" en el menu de inicio.
- **Mac:** abre "Terminal" (Aplicaciones > Utilidades).
- **Linux:** normalmente Ctrl+Alt+T.

## Que es un comando

Una linea de texto que ordena una accion. Por ejemplo:

\`\`\`bash
python --version
\`\`\`

Le pide a la computadora que diga que version de Python tiene. Escribes el comando,
presionas Enter, y ves el resultado debajo.

## Ideas que quitan el miedo

- Si algo sale en rojo (un error), **no rompiste nada**: copia el texto y preguntale al tutor.
- Puedes **copiar y pegar** comandos; no hay que escribirlos a mano.
- La terminal siempre esta "parada" en una carpeta. En el curso te diras en cual.

## Lo minimo que debes recordar

- La terminal ejecuta comandos de texto; Enter los corre.
- Un error es informacion, no un desastre: leelo o pasaselo al tutor.
`,
    practica: `# Practica (PC)

Abre tu terminal y escribe \`python --version\`. Copia lo que salga (aunque sea un
error) y compartelo con el tutor de la plataforma.
`,
    preguntas: [
      { id: "p0-1", tipo: "opcion_multiple", bloom: "recordar", pregunta: ".Que hace la tecla Enter tras escribir un comando?", opciones: ["Borra el comando", "Ejecuta el comando", "Abre el navegador", "Cierra la terminal"], respuesta: 1, explicacion: "Enter ejecuta el comando escrito." },
      { id: "p0-2", tipo: "verdadero_falso", bloom: "comprender", pregunta: "Un mensaje de error significa que danaste la computadora.", respuesta: false, explicacion: "Un error es solo informacion; no rompe nada." },
      { id: "p0-3", tipo: "opcion_multiple", bloom: "recordar", pregunta: ".En Windows, que programa usamos como terminal?", opciones: ["Word", "PowerShell", "Excel", "Paint"], respuesta: 1, explicacion: "PowerShell es la terminal recomendada en Windows." },
    ],
    tarjetas: [
      { frente: ".Que es la terminal?", reverso: "Una ventana para darle ordenes a la computadora escribiendo comandos de texto." },
      { frente: ".Que haces si un comando muestra un error?", reverso: "Leerlo con calma o copiarlo y preguntarle al tutor; no rompe nada." },
      { frente: ".Con que tecla ejecutas un comando?", reverso: "Enter." },
    ],
  },
  {
    slug: "prerreq-01-json",
    numero: -14,
    nombre: "JSON en 10 minutos",
    resumen: "Que es JSON, objetos, listas y como se leen los datos anidados.",
    objetivos: ["Reconocer un objeto y una lista en JSON", "Leer un valor por su ruta"],
    enlaces: [{ titulo: "Introduccion a JSON (MDN)", url: "https://developer.mozilla.org/es/docs/Learn/JavaScript/Objects/JSON" }],
    leccion: `# JSON en 10 minutos

> **En simple:** JSON es una forma de escribir datos como texto, con etiquetas y
> valores, para que una computadora los entienda. Piensa en una ficha con casillas.

## Las dos piezas

- **Objeto** \`{ }\`: agrupa pares \`"clave": valor\`. Como una ficha con casillas etiquetadas.
- **Lista (array)** \`[ ]\`: una secuencia ordenada de elementos.

\`\`\`json
{
  "nombre": "Maria",
  "edad": 34,
  "activa": true,
  "telefonos": ["7777-0000", "2222-1111"]
}
\`\`\`

- \`"nombre"\` es una clave; \`"Maria"\` su valor (texto, va entre comillas).
- \`edad\` es un numero (sin comillas). \`activa\` es booleano (\`true\`/\`false\`).
- \`telefonos\` es una **lista** con dos textos.

## Rutas: como se nombra un dato

Para el primer telefono decimos \`telefonos[0]\` (las listas empiezan en 0).
FHIR usa mucho esta idea: \`Patient.name[0].family\` = "del paciente, el primer
nombre, su apellido".

## Lo minimo que debes recordar

- Objeto = casillas con etiqueta; lista = fila ordenada que empieza en 0.
- El texto va entre comillas dobles; numeros y \`true/false\` no.
`,
    practica: `# Practica (PC)

Abre cualquier editor de texto y escribe un objeto JSON que te describa: nombre,
edad y una lista de dos correos. Pidele al tutor de la plataforma que lo revise.
`,
    preguntas: [
      { id: "p1-1", tipo: "opcion_multiple", bloom: "recordar", pregunta: "En JSON, .que simbolo abre un objeto?", opciones: ["[", "{", "(", "<"], respuesta: 1, explicacion: "El objeto se escribe entre llaves { }." },
      { id: "p1-2", tipo: "verdadero_falso", bloom: "recordar", pregunta: "Las listas en JSON empiezan a contar desde 0.", respuesta: true, explicacion: "El primer elemento es el indice 0." },
      { id: "p1-3", tipo: "respuesta_corta", bloom: "aplicar", pregunta: "Escribe la ruta del primer elemento de una lista llamada correos.", respuestas_validas: ["correos[0]"], explicacion: "Indice 0 para el primero." },
    ],
    tarjetas: [
      { frente: ".Que es un objeto en JSON?", reverso: "Un grupo de pares clave:valor entre llaves { }." },
      { frente: ".Que es una lista/array en JSON?", reverso: "Una secuencia ordenada de elementos entre corchetes [ ], que empieza en 0." },
      { frente: ".Como se escribe un texto en JSON?", reverso: "Entre comillas dobles, por ejemplo \"Maria\"." },
    ],
  },
  {
    slug: "prerreq-02-apis-http",
    numero: -13,
    nombre: "Que es una API y HTTP",
    resumen: "Cliente y servidor, peticiones HTTP y por que FHIR es una API web.",
    objetivos: ["Explicar cliente/servidor", "Reconocer GET y POST"],
    enlaces: [{ titulo: "Que es una API (MDN)", url: "https://developer.mozilla.org/es/docs/Learn/JavaScript/Client-side_web_APIs/Introduction" }],
    leccion: `# Que es una API y HTTP

> **En simple:** una API es un mesero. Tu (el cliente) pides algo; la cocina (el
> servidor) lo prepara y te lo trae. HTTP es el idioma en que haces el pedido.

## Cliente y servidor

- **Cliente**: quien pide (tu navegador, una app, un script).
- **Servidor**: quien responde (guarda los datos y los entrega).
- **API**: el menu de cosas que puedes pedir y como pedirlas.

## Metodos HTTP (los verbos del pedido)

| Verbo | Significa | Ejemplo |
|-------|-----------|---------|
| GET | dame / lee | traer un paciente |
| POST | crea | registrar un paciente nuevo |
| PUT | actualiza | corregir un dato |
| DELETE | borra | eliminar un registro |

## Codigos de respuesta

- **200** todo bien. **404** no existe. **401/403** no autorizado.
- **4xx** = te equivocaste tu; **5xx** = fallo el servidor.

FHIR es exactamente esto: una API web donde pides recursos clinicos por HTTP,
por ejemplo \`GET [base]/Patient/123\`.
`,
    practica: `# Practica (PC)

En el navegador abre \`https://hapi.fhir.org/baseR4/Patient?_count=1\` y observa la
respuesta JSON. Cuentale al tutor que verbo HTTP uso el navegador.
`,
    preguntas: [
      { id: "p2-1", tipo: "opcion_multiple", bloom: "recordar", pregunta: ".Que verbo HTTP se usa para LEER sin modificar?", opciones: ["POST", "GET", "DELETE", "PUT"], respuesta: 1, explicacion: "GET es de solo lectura." },
      { id: "p2-2", tipo: "opcion_multiple", bloom: "comprender", pregunta: "Un codigo 404 significa:", opciones: ["Todo bien", "No autorizado", "No existe el recurso", "Error del servidor"], respuesta: 2, explicacion: "404 = Not Found." },
      { id: "p2-3", tipo: "verdadero_falso", bloom: "comprender", pregunta: "Los errores 5xx indican un fallo del servidor.", respuesta: true, explicacion: "5xx = lado servidor; 4xx = lado cliente." },
    ],
    tarjetas: [
      { frente: ".Que es una API?", reverso: "Un contrato para pedir y recibir datos entre un cliente y un servidor." },
      { frente: ".Diferencia entre 4xx y 5xx?", reverso: "4xx = error del cliente; 5xx = error del servidor." },
      { frente: ".Con que verbo se crea un recurso nuevo?", reverso: "POST." },
    ],
  },
  {
    slug: "prerreq-03-python",
    numero: -12,
    nombre: "Python minimo",
    resumen: "Variables, imprimir, y correr un script; lo justo para las practicas.",
    objetivos: ["Ejecutar un script .py", "Leer variables y print"],
    enlaces: [{ titulo: "Tutorial oficial de Python (es)", url: "https://docs.python.org/es/3/tutorial/" }],
    leccion: `# Python minimo

> **En simple:** Python es un lenguaje facil de leer. En este curso solo lo usaras
> para correr pequenos scripts que hablan con servidores FHIR.

## Lo esencial

\`\`\`python
nombre = "Maria"          # una variable guarda un valor
edad = 34
print("Hola", nombre)     # print muestra algo en pantalla
\`\`\`

- \`variable = valor\` guarda datos.
- \`print(...)\` muestra en la terminal.
- Las comillas hacen texto; los numeros van sin comillas.

## Correr un script

En la terminal, dentro de la carpeta del proyecto:

\`\`\`bash
python mi_script.py
\`\`\`

No necesitas memorizar Python: cuando una practica pida cambiar algo, el tutor te
guia linea por linea.
`,
    practica: `# Practica (PC)

Crea un archivo \`hola.py\` con \`print("Hola FHIR")\` y ejecutalo con
\`python hola.py\`. Si algo falla, copia el error al tutor.
`,
    preguntas: [
      { id: "p3-1", tipo: "opcion_multiple", bloom: "recordar", pregunta: ".Que hace print() en Python?", opciones: ["Guarda un archivo", "Muestra algo en pantalla", "Borra datos", "Abre el navegador"], respuesta: 1, explicacion: "print muestra texto en la terminal." },
      { id: "p3-2", tipo: "verdadero_falso", bloom: "recordar", pregunta: "En Python el texto va entre comillas.", respuesta: true, explicacion: "Los strings usan comillas." },
      { id: "p3-3", tipo: "respuesta_corta", bloom: "aplicar", pregunta: ".Que comando ejecuta el archivo hola.py?", respuestas_validas: ["python hola.py"], explicacion: "python <archivo>." },
    ],
    tarjetas: [
      { frente: ".Como se guarda un valor en Python?", reverso: "Con una variable: nombre = valor." },
      { frente: ".Que hace print()?", reverso: "Muestra un valor en la terminal." },
      { frente: ".Como se corre un script?", reverso: "python archivo.py" },
    ],
  },
  {
    slug: "prerreq-04-sql",
    numero: -11,
    nombre: "SQL minimo",
    resumen: "Tablas, filas y una consulta SELECT basica.",
    objetivos: ["Leer una tabla", "Escribir un SELECT simple"],
    enlaces: [{ titulo: "SELECT basico (W3Schools, es)", url: "https://www.w3schools.com/sql/sql_select.asp" }],
    leccion: `# SQL minimo

> **En simple:** una base de datos SQL es una hoja de calculo gigante. SQL es como
> le pides datos: "traeme estas columnas de esta tabla, donde se cumpla X".

## Ideas base

- **Tabla**: una hoja (por ejemplo \`pacientes\`).
- **Fila**: un registro (un paciente).
- **Columna**: un campo (\`nombre\`, \`edad\`).

## La consulta mas comun

\`\`\`sql
SELECT nombre, edad
FROM pacientes
WHERE edad > 18;
\`\`\`

- \`SELECT\` = que columnas quiero.
- \`FROM\` = de que tabla.
- \`WHERE\` = con que condicion.

En esta plataforma casi todo lo resuelve el sistema; SQL te sirve para entender
como se guardan tu progreso y los datos.
`,
    practica: `# Practica (PC)

En papel o con el tutor, escribe un SELECT que traiga el \`nombre\` de la tabla
\`pacientes\` cuyo \`municipio\` sea "San Salvador".
`,
    preguntas: [
      { id: "p4-1", tipo: "opcion_multiple", bloom: "recordar", pregunta: ".Que palabra elige las columnas a traer?", opciones: ["FROM", "WHERE", "SELECT", "ORDER"], respuesta: 2, explicacion: "SELECT indica las columnas." },
      { id: "p4-2", tipo: "opcion_multiple", bloom: "comprender", pregunta: ".Que hace la clausula WHERE?", opciones: ["Ordena", "Filtra filas por condicion", "Borra la tabla", "Une tablas"], respuesta: 1, explicacion: "WHERE filtra por condicion." },
      { id: "p4-3", tipo: "verdadero_falso", bloom: "recordar", pregunta: "Una fila representa un registro (por ejemplo, un paciente).", respuesta: true, explicacion: "Fila = registro; columna = campo." },
    ],
    tarjetas: [
      { frente: ".Que hace SELECT?", reverso: "Elige las columnas que quieres traer." },
      { frente: ".Que hace WHERE?", reverso: "Filtra las filas segun una condicion." },
      { frente: ".Que es una fila en una tabla?", reverso: "Un registro individual." },
    ],
  },
];

function main() {
  const { temas } = leerJSON<TemasJSON>("evaluacion/temas.json");
  const flashcards = leerJSON<Flashcard[]>("evaluacion/flashcards.json");

  // Limpia y recrea /contenido
  fs.rmSync(CONTENIDO, { recursive: true, force: true });
  fs.mkdirSync(CONTENIDO, { recursive: true });

  const curriculo: {
    etapas: { numero: number; slug: string; nombre: string; meta: string; orden: number; temas: string[] }[];
  } = { etapas: ETAPAS.map((e) => ({ ...e, temas: [] as string[] })) };

  const etapaPorSlug = Object.fromEntries(curriculo.etapas.map((e) => [e.slug, e]));

  // --- Temas migrados del laboratorio ---
  for (const tema of temas) {
    const etapaSlug = TEMA_A_ETAPA[tema.id] ?? "cimientos";
    const relDir = `etapas/${etapaSlug}/${tema.slug}`;

    // Lectura
    const leccion = leer(tema.movil) || `# ${tema.nombre}\n\n_(Contenido en preparacion.)_`;
    escribir(relDir, "leccion.md", leccion);

    // Quiz (merge de los dias del tema)
    const preguntas: unknown[] = [];
    for (const d of tema.dias) {
      const dir = typeof d === "number" ? `dia-${String(d).padStart(2, "0")}` : String(d);
      const raw = leer(`dias/${dir}/quiz.json`);
      if (!raw) continue;
      const q = JSON.parse(raw) as { preguntas?: unknown[] };
      if (Array.isArray(q.preguntas)) preguntas.push(...q.preguntas);
    }
    escribir(relDir, "quiz.json", JSON.stringify({ umbralMaestria: 0.8, preguntas }, null, 2));

    // Tarjetas (filtradas por dia)
    const diasStr = tema.dias.map(String);
    const tarjetas = flashcards
      .filter((f) => diasStr.includes(String(f.dia)))
      .map((f) => ({ claveLegacy: f.id, frente: f.frente, reverso: f.reverso }));
    escribir(relDir, "tarjetas.json", JSON.stringify(tarjetas, null, 2));

    // Practica en PC
    escribir(relDir, "practica.md", practicaPCDesdeDias(tema.dias) || "# Practica\n\n_(En preparacion.)_");

    // Practica nacional
    const pn = seccionPracticaNacional(tema.id);
    escribir(relDir, "practica-nacional.md", pn || `## Practica nacional\n\n${tema.practica_institucional}`);

    // NotebookLM
    escribir(relDir, "notebooklm.md", checklistNotebookLM(tema));

    // Metadatos del tema
    escribir(relDir, "tema.json", JSON.stringify({
      slug: tema.slug,
      numero: tema.id,
      nombre: tema.nombre,
      resumen: tema.resumen,
      opcional: !!tema.opcional,
      objetivos: [],
      enlaces: [],
      notebooklm: { nombreCuaderno: `FHIR — ${tema.nombre}` },
    }, null, 2));

    etapaPorSlug[etapaSlug].temas.push(`${etapaSlug}/${tema.slug}`);
  }

  // --- Etapa -1: prerrequisitos (stubs reales; se amplian en la fase de contenido) ---
  for (const p of PRERREQUISITOS) {
    const relDir = `etapas/prerrequisitos/${p.slug}`;
    escribir(relDir, "leccion.md", p.leccion);
    escribir(relDir, "quiz.json", JSON.stringify({ umbralMaestria: 0.8, preguntas: p.preguntas }, null, 2));
    escribir(relDir, "tarjetas.json", JSON.stringify(p.tarjetas, null, 2));
    escribir(relDir, "practica.md", p.practica);
    escribir(relDir, "notebooklm.md", checklistNotebookLMSimple(p.nombre));
    escribir(relDir, "tema.json", JSON.stringify({
      slug: p.slug,
      numero: p.numero,
      nombre: p.nombre,
      resumen: p.resumen,
      opcional: false,
      objetivos: p.objetivos,
      enlaces: p.enlaces,
      notebooklm: { nombreCuaderno: `Bases — ${p.nombre}` },
    }, null, 2));
    etapaPorSlug["prerrequisitos"].temas.push(`prerrequisitos/${p.slug}`);
  }

  fs.writeFileSync(path.join(CONTENIDO, "curriculo.json"), JSON.stringify(curriculo, null, 2), "utf8");

  // Recursos globales
  const enlaces = leer("recursos/enlaces-oficiales.md");
  if (enlaces) fs.writeFileSync(path.join(CONTENIDO, "enlaces-oficiales.md"), enlaces, "utf8");

  const totalTemas = curriculo.etapas.reduce((n, e) => n + e.temas.length, 0);
  console.log(`OK -> ${path.relative(RAIZ, CONTENIDO)}`);
  console.log(`  etapas: ${curriculo.etapas.length} | temas migrados: ${totalTemas}`);
}

main();
