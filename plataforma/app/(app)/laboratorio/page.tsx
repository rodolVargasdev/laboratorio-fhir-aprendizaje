import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, Lightbulb, Monitor } from "lucide-react";
import { FhirPlayground } from "@/components/fhir-playground";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";

export const metadata: Metadata = { title: "Laboratorio" };

const RETOS = [
  "Pide el CapabilityStatement (metadata) y busca en la respuesta que versiones de FHIR soporta el servidor.",
  "Trae 3 pacientes y observa: .como se llama el campo que dice el tipo de recurso?",
  "Busca pacientes por apellido y cambia el _count. .Que hace ese parametro?",
  "Trae una Observation y localiza el value[x]: .es un numero, un codigo, un texto?",
  "Usa _include para traer un Encounter junto con su Patient. .Cuantas entradas trae el Bundle?",
];

export default function LaboratorioPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Laboratorio FHIR</h1>
          <p className="text-sm text-muted-foreground">
            Haz peticiones REST reales a un servidor FHIR publico, aqui mismo en el navegador.
          </p>
        </div>
      </header>

      <FhirPlayground />

      <Tarjeta>
        <TarjetaContenido>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Lightbulb className="h-4 w-4 text-primary" /> Retos para practicar
          </div>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            {RETOS.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            .Te atoras? Abre el <strong>Tutor</strong> (boton abajo a la derecha) y pregunta.
          </p>
        </TarjetaContenido>
      </Tarjeta>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
        <div className="text-sm">
          <div className="font-semibold">.Ejercicios que piden tu PC?</div>
          <p className="text-muted-foreground">
            Algunos temas (Google Cloud, scripts) se hacen en tu computadora. Prepara tu
            entorno una sola vez con la{" "}
            <Link href="/setup" className="font-semibold text-primary hover:underline">
              guia de setup del workspace
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
