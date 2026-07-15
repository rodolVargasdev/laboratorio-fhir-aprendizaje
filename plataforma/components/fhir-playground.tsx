"use client";

import { useState } from "react";
import { Play, Server, AlertCircle } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BASE = "https://hapi.fhir.org/baseR4";

const EJEMPLOS: { etiqueta: string; path: string; nota: string }[] = [
  { etiqueta: "CapabilityStatement", path: "metadata", nota: "Que soporta el servidor (GET [base]/metadata)." },
  { etiqueta: "Buscar pacientes", path: "Patient?_count=3", nota: "Trae 3 Patient (paginacion con _count)." },
  { etiqueta: "Paciente por apellido", path: "Patient?family=Smith&_count=2", nota: "Busqueda por parametro family." },
  { etiqueta: "Observaciones", path: "Observation?_count=2", nota: "Recurso Observation (resultados/labs)." },
  { etiqueta: "Encuentro + include", path: "Encounter?_count=1&_include=Encounter:patient", nota: "_include trae el Patient referenciado." },
];

export function FhirPlayground() {
  const [path, setPath] = useState("metadata");
  const [cargando, setCargando] = useState(false);
  const [estado, setEstado] = useState<number | null>(null);
  const [salida, setSalida] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setCargando(true);
    setError(null);
    setSalida("");
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
          <Play className="h-4 w-4" /> {cargando ? "…" : "Enviar"}
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
            {estado < 300 ? "OK — la peticion fue exitosa" : "El servidor devolvio un error"}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {salida && (
        <pre className="max-h-96 overflow-auto rounded-md bg-navy p-3 font-mono text-xs leading-relaxed text-[#e6edf6]">
          {salida}
        </pre>
      )}
    </div>
  );
}
