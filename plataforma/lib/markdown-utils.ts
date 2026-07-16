/**
 * Utilidades compartidas entre el renderizador de markdown y el indice de la
 * leccion: la MISMA funcion de slug garantiza que los anchors coincidan.
 */

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // sin tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export type Encabezado = { nivel: 2 | 3; texto: string; id: string };

/** Extrae los encabezados ## y ### de un markdown (ignora los que estan dentro de bloques de codigo). */
export function extraerEncabezados(markdown: string): Encabezado[] {
  const out: Encabezado[] = [];
  const vistos = new Map<string, number>();
  let enCodigo = false;
  for (const linea of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(linea)) {
      enCodigo = !enCodigo;
      continue;
    }
    if (enCodigo) continue;
    const m = linea.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const nivel = m[1].length as 2 | 3;
    // Limpia marcado inline basico (negritas, codigo, enlaces)
    const texto = m[2]
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();
    let id = slugify(texto);
    // Desambigua duplicados igual que lo hara el renderizador (mismo orden).
    const n = vistos.get(id) ?? 0;
    vistos.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    out.push({ nivel, texto, id });
  }
  return out;
}

/** Crea un generador de ids con desambiguacion de duplicados (para el renderizador). */
export function crearGeneradorIds() {
  const vistos = new Map<string, number>();
  return (texto: string) => {
    let id = slugify(texto);
    const n = vistos.get(id) ?? 0;
    vistos.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    return id;
  };
}
