// Extrae el grafo de referencias (nodos y aristas) de un Bundle o recurso FHIR.
// Modulo puro: sin React ni three, para poder probarlo con node:test.

export type NodoFhir = {
  id: string;
  tipo: string;
  recursoId?: string;
  etiqueta: string;
  externo: boolean;
  recurso?: unknown;
};

/** ruta = path JSON del campo, por ejemplo "subject" o "participant[0].individual". */
export type AristaFhir = { origen: string; destino: string; ruta: string };

export type GrafoFhir = { nodos: NodoFhir[]; aristas: AristaFhir[] };

export const MAX_NODOS = 200;

/** Paleta azul/gris/navy por tipo de recurso, compartida por el visor y su leyenda. */
export const COLOR_TIPO: Record<string, string> = {
  Patient: "#048DF3",
  Encounter: "#0E2E6E",
  Observation: "#3AA5F6",
  Condition: "#164096",
  Practitioner: "#64748B",
  PractitionerRole: "#64748B",
  Organization: "#64748B",
};
export const COLOR_OTROS = "#94A3B8";
export const COLOR_EXTERNO = "#CBD5E1";

export function colorDeTipo(tipo: string): string {
  return COLOR_TIPO[tipo] ?? COLOR_OTROS;
}
const LARGO_ID_ETIQUETA = 12;
const TIPO_VALIDO = /^[A-Z][A-Za-z]+$/;

type Obj = Record<string, unknown>;

function esObjeto(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function etiquetaDe(tipo: string, id: string | undefined, recurso: Obj | undefined): string {
  if (tipo === "Patient" && recurso) {
    const nombres = recurso.name;
    const n = Array.isArray(nombres) ? nombres[0] : undefined;
    if (esObjeto(n)) {
      const given = Array.isArray(n.given) && typeof n.given[0] === "string" ? n.given[0] : "";
      const family = typeof n.family === "string" ? n.family : "";
      const completo = `${given} ${family}`.trim();
      if (completo) return completo;
    }
  }
  const idCorto =
    id === undefined
      ? "(sin id)"
      : id.length > LARGO_ID_ETIQUETA
        ? `${id.slice(0, LARGO_ID_ETIQUETA)}...`
        : id;
  return `${tipo}/${idCorto}`;
}

/** Devuelve tipo e id de una referencia relativa o absoluta, o null si no tiene esa forma. */
function canonicaDe(ref: string): { tipo: string; id: string } | null {
  const sinExtras = ref.split(/[?#]/)[0];
  const sinHistoria = sinExtras.replace(/\/_history\/[^/]+$/, "");
  const partes = sinHistoria.split("/").filter(Boolean);
  if (partes.length < 2) return null;
  const tipo = partes[partes.length - 2];
  const id = partes[partes.length - 1];
  if (!TIPO_VALIDO.test(tipo) || !id) return null;
  return { tipo, id };
}

export function extraerGrafo(json: unknown): GrafoFhir | null {
  if (!esObjeto(json) || typeof json.resourceType !== "string") return null;

  const nodos: NodoFhir[] = [];
  const porId = new Map<string, NodoFhir>();
  const porFullUrl = new Map<string, NodoFhir>();
  const aristas: AristaFhir[] = [];
  const vistas = new Set<string>();

  // Recursos que aportan nodos: las entradas de un Bundle o el recurso suelto.
  const fuentes: { fullUrl?: string; recurso: Obj }[] = [];
  if (json.resourceType === "Bundle") {
    const entradas = Array.isArray(json.entry) ? json.entry : [];
    for (const e of entradas) {
      if (esObjeto(e) && esObjeto(e.resource) && typeof e.resource.resourceType === "string") {
        fuentes.push({
          fullUrl: typeof e.fullUrl === "string" ? e.fullUrl : undefined,
          recurso: e.resource,
        });
      }
    }
  } else {
    fuentes.push({ recurso: json });
  }

  const nodoDe = new Map<Obj, NodoFhir>();
  fuentes.forEach(({ fullUrl, recurso }, i) => {
    if (nodos.length >= MAX_NODOS) return;
    const tipo = recurso.resourceType as string;
    const recursoId = typeof recurso.id === "string" ? recurso.id : undefined;
    const id = `${tipo}/${recursoId ?? `sin-id-${i}`}`;
    let nodo = porId.get(id);
    if (!nodo) {
      nodo = {
        id,
        tipo,
        recursoId,
        etiqueta: etiquetaDe(tipo, recursoId, recurso),
        externo: false,
        recurso,
      };
      nodos.push(nodo);
      porId.set(id, nodo);
    }
    if (fullUrl) porFullUrl.set(fullUrl, nodo);
    nodoDe.set(recurso, nodo);
  });

  function crearExterno(id: string, tipo: string, recursoId: string): NodoFhir | null {
    const previo = porId.get(id);
    if (previo) return previo;
    if (nodos.length >= MAX_NODOS) return null;
    const nodo: NodoFhir = {
      id,
      tipo,
      recursoId,
      etiqueta: etiquetaDe(tipo, recursoId, undefined),
      externo: true,
    };
    nodos.push(nodo);
    porId.set(id, nodo);
    return nodo;
  }

  function resolver(ref: string): NodoFhir | null {
    if (ref.startsWith("#")) return null;
    const porUrl = porFullUrl.get(ref);
    if (porUrl) return porUrl;
    const canon = canonicaDe(ref);
    if (!canon) {
      return ref.startsWith("urn:") ? crearExterno(ref, "Referencia", ref) : null;
    }
    const id = `${canon.tipo}/${canon.id}`;
    return porId.get(id) ?? crearExterno(id, canon.tipo, canon.id);
  }

  function agregarArista(origen: NodoFhir, ref: string, ruta: string) {
    const destino = resolver(ref);
    if (!destino || destino.id === origen.id) return;
    const clave = `${origen.id}\u0000${destino.id}\u0000${ruta}`;
    if (vistas.has(clave)) return;
    vistas.add(clave);
    aristas.push({ origen: origen.id, destino: destino.id, ruta });
  }

  function recorrer(valor: unknown, ruta: string, origen: NodoFhir) {
    if (Array.isArray(valor)) {
      valor.forEach((v, i) => recorrer(v, `${ruta}[${i}]`, origen));
      return;
    }
    if (!esObjeto(valor)) return;
    if (typeof valor.reference === "string") agregarArista(origen, valor.reference, ruta);
    for (const [k, v] of Object.entries(valor)) {
      recorrer(v, `${ruta}.${k}`, origen);
    }
  }

  for (const { recurso } of fuentes) {
    const origen = nodoDe.get(recurso);
    if (!origen) continue; // recortado por el limite de nodos
    for (const [k, v] of Object.entries(recurso)) {
      // La narrativa y los recursos contenidos no forman parte del grafo.
      if (k === "contained" || k === "text") continue;
      recorrer(v, k, origen);
    }
  }

  return { nodos, aristas };
}
