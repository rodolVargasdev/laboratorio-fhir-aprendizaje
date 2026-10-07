"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Play, Server, AlertCircle } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COLOR_EXTERNO,
  COLOR_OTROS,
  COLOR_TIPO,
  extraerGrafo,
  type NodoFhir,
} from "@/lib/fhir-grafo";

const VisorBundle3D = dynamic(() => import("@/components/visor-bundle-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground sm:h-[420px]">
      Cargando visor...
    </div>
  ),
});

const LEYENDA: { etiqueta: string; color: string }[] = [
  { etiqueta: "Patient", color: COLOR_TIPO.Patient },
  { etiqueta: "Encounter", color: COLOR_TIPO.Encounter },
  { etiqueta: "Observation", color: COLOR_TIPO.Observation },
  { etiqueta: "Condition", color: COLOR_TIPO.Condition },
  { etiqueta: "Practitioner / Organization", color: COLOR_TIPO.Organization },
  { etiqueta: "Otros", color: COLOR_OTROS },
];

const BASE = "https://hapi.fhir.org/baseR4";

const EJEMPLOS: { etiqueta: string; path: string; nota: string }[] = [
  { etiqueta: "CapabilityStatement", path: "metadata", nota: "Que soporta el servidor (GET [base]/metadata)." },
  { etiqueta: "Buscar pacientes", path: "Patient?_count=3", nota: "Trae 3 Patient (paginacion con _count)." },
  { etiqueta: "Paciente por apellido", path: "Patient?family=Smith&_count=2", nota: "Busqueda por parametro family." },
  { etiqueta: "Observaciones", path: "Observation?_count=2", nota: "Recurso Observation (resultados/labs)." },
  { etiqueta: "Observacion + paciente", path: "Observation?_count=3&_include=Observation:subject", nota: "_include trae el Patient (subject) de cada Observation." },
  { etiqueta: "Encuentro + include", path: "Encounter?_count=1&_include=Encounter:patient", nota: "_include trae el Patient referenciado." },
];

export function FhirPlayground() {
  const [path, setPath] = useState("metadata");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<number | null>(null);
  const [salida, setSalida] = useState<string>("");
  const [json, setJson] = useState<unknown>(null);
  const [vista, setVista] = useState<"json" | "grafo">("json");
  const [seleccion, setSeleccion] = useState<NodoFhir | null>(null);
  const grafo = useMemo(() => (json === null ? null : extraerGrafo(json)), [json]);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setCargando(true);
    setError(null);
    setSalida("");
    setJson(null);
    setSeleccion(null);
    setVista("json");
    setEstado(null);
    const limpio = path.replace(/^\/+/, "");
    try {
      const res = await fetch(`${BASE}/${limpio}`, {
        headers: { Accept: "application/fhir+json" },
      });
      setEstado(res.status);
      const texto = await res.text();
      try {
        const json = JSON.parse(texto);
        setJson(json);
        setSalida(JSON.stringify(json, null, 2));
      } catch {
        setSalida(texto);
      }
    } catch (e) {
      setError(
        "No se pudo conectar al servidor de pruebas. Revisa tu internet e intenta de nuevo. " +
          (e instanceof Error ? e.message : "")
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Server className="h-4 w-4" />
        Servidor de pruebas publico (solo lectura, datos ficticios):{" "}
        <code className="font-mono">{BASE}</code>
      </div>

      <div className="flex flex-wrap gap-2">
        {EJEMPLOS.map((e) => (
          <button
            key={e.path}
            title={e.nota}
            onClick={() => setPath(e.path)}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold hover:bg-muted"
          >
            {e.etiqueta}
          </button>
        ))}
      </div>

      <div className="flex items-stretch gap-2">
        <span className="hidden items-center rounded-md bg-navy px-3 font-mono text-xs text-white sm:flex">
          GET {BASE}/
        </span>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          spellCheck={false}
          className="h-11 flex-1 rounded-md border border-input bg-card px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Patient?_count=1"
        />
        <Boton onClick={enviar} disabled={cargando}>
          <Play className="h-4 w-4" /> {cargando ? "..." : "Enviar"}
        </Boton>
      </div>

      {estado !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono font-bold",
              estado < 300 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            )}
          >
            {estado}
          </span>
          <span className="text-muted-foreground">
            {estado < 300 ? "OK: la peticion fue exitosa" : "El servidor devolvio un error"}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {salida && grafo && (
        <div role="tablist" aria-label="Vista de la respuesta" className="flex gap-2">
          {(["json", "grafo"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              title={v === "json" ? "Respuesta como texto JSON" : "Recursos y referencias en 3D"}
              className={cn(
                "rounded-full border px-4 py-1 text-xs font-semibold",
                vista === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              {v === "json" ? "JSON" : "Grafo"}
            </button>
          ))}
        </div>
      )}

      {salida && (!grafo || vista === "json") && (
        <pre className="max-h-96 overflow-auto rounded-md bg-navy p-3 font-mono text-xs leading-relaxed text-[#e6edf6]">
          {salida}
        </pre>
      )}

      {salida && grafo && vista === "grafo" && (
        <div role="tabpanel" className="flex flex-col gap-3">
          <VisorBundle3D grafo={grafo} onSeleccion={setSeleccion} />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {grafo.nodos.length} {grafo.nodos.length === 1 ? "recurso" : "recursos"},{" "}
              {grafo.aristas.length} {grafo.aristas.length === 1 ? "referencia" : "referencias"}
            </span>
            <span
              className="hidden pointer-fine:inline"
              title="Arrastre para girar. Ctrl o Cmd con la rueda para acercar."
            >
              Ctrl + rueda: zoom
            </span>
            {grafo.aristas.length === 0 && (
              <span className="rounded-full bg-warning-soft px-2 py-0.5 font-semibold text-warning">
                Sin referencias
              </span>
            )}
            {LEYENDA.map((l) => (
              <span key={l.etiqueta} className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                {l.etiqueta}
              </span>
            ))}
            <span
              className="flex items-center gap-1"
              title="El recurso esta referenciado pero no viene en la respuesta"
            >
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full border border-dashed border-muted-foreground"
                style={{ backgroundColor: COLOR_EXTERNO, opacity: 0.6 }}
              />
              externo: no viene en el Bundle
            </span>
          </div>

          {seleccion ? (
            seleccion.externo ? (
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <strong className="font-mono text-foreground">{seleccion.id}</strong> no viene en la
                respuesta. Puede traerlo con <code className="font-mono">_include</code>.
              </p>
            ) : (
              <pre className="max-h-96 overflow-auto rounded-md bg-navy p-3 font-mono text-xs leading-relaxed text-[#e6edf6]">
                {JSON.stringify(seleccion.recurso, null, 2)}
              </pre>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Haga clic en un nodo para ver su JSON.</p>
          )}

          <details className="rounded-md border border-border bg-card p-3 text-xs">
            <summary className="cursor-pointer font-semibold">Ver como lista</summary>
            {grafo.aristas.length === 0 ? (
              <p className="mt-2 text-muted-foreground">Esta respuesta no contiene referencias.</p>
            ) : (
              <ul className="mt-2 space-y-1 font-mono">
                {grafo.aristas.map((a, i) => (
                  <li key={i}>
                    {a.origen} -&gt; {a.ruta} -&gt; {a.destino}
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>
      )}
    </div>
  );
}
