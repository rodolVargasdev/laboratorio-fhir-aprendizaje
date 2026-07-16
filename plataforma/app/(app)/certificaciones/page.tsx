import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificaciones" };

type Ruta = {
  paso: number;
  nombre: string;
  apodo: string;
  oficial: boolean;
  umbral: string;
  requisito?: string;
  descripcion: string;
  dominios: { nombre: string; peso: number; cubierto: string }[];
  criterios: string[];
  enlaces: { titulo: string; url: string }[];
};

const RUTAS: Ruta[] = [
  {
    paso: 1,
    nombre: "HL7 FHIR Foundational Implementer",
    apodo: "La fundacion",
    oficial: true,
    umbral: "Aprobado ~60% · objetivo de simulacros: 65%+ (100 preguntas / 180 min)",
    descripcion:
      "El examen de entrada oficial de HL7 (reemplazo al antiguo R4 Proficiency, retirado en dic. 2024). Evalua FHIR R4: modelo de recursos, API REST, implementacion, validacion e IGs. ESTE CURSO CUBRE SU TEMARIO COMPLETO.",
    dominios: [
      { nombre: "Resource Model and Structure", peso: 29, cubierto: "Etapas 1-2 (JSON/XML, modelo FHIR, terminologias)" },
      { nombre: "FHIR API Behavior", peso: 26, cubierto: "Etapas 1-2 (HTTP/REST, busqueda) + Laboratorio" },
      { nombre: "Implementation", peso: 24, cubierto: "Etapas 1 y 3 (CRUD, GCP, proyecto integrador)" },
      { nombre: "Troubleshooting and Validation", peso: 15, cubierto: "Etapa 2 (validacion y profiles) + practicas" },
      { nombre: "Understanding Implementation Guides", peso: 6, cubierto: "Etapas 0 y 2 (panorama, US Core, profiles)" },
    ],
    criterios: [
      "Los 15 temas obligatorios de la ruta completados (quiz >= 80% cada uno).",
      "2 o mas simulacros >= 65% en dias DISTINTOS dentro de las ultimas 2 semanas.",
      "Ningun tema con mejor quiz < 60% (sin dominios flojos).",
      "Semaforo del panel en VERDE.",
    ],
    enlaces: [
      { titulo: "Pagina oficial de certificacion FHIR (HL7)", url: "https://www.hl7.org/certification/fhir.cfm" },
      { titulo: "Curso oficial de preparacion (courses.hl7.org)", url: "https://courses.hl7.org/" },
    ],
  },
  {
    paso: 2,
    nombre: "Competencia practica: Google Cloud Healthcare API",
    apodo: "El laboratorio",
    oficial: false,
    umbral: "Autoevaluacion practica: 80%+ en cada competencia, con evidencia",
    descripcion:
      "No es un examen oficial: es la practica real en la nube que HL7 recomienda tener antes del Advanced Developer, y la base tecnica del piloto institucional. Se demuestra con evidencia (ejercicios ejecutados y verificados), no con sensaciones.",
    dominios: [
      { nombre: "Proyecto, jerarquia, dataset y FHIR store", peso: 25, cubierto: "Tema: FHIR en Google Cloud" },
      { nombre: "CRUD y REST sobre el store", peso: 30, cubierto: "Temas: GCP + proyecto integrador" },
      { nombre: "Validacion, rechazo de datos y OperationOutcome", peso: 20, cubierto: "Tema: validacion y profiles (aplicado en GCP)" },
      { nombre: "Seguridad, IAM y tokens de acceso", peso: 15, cubierto: "Temas: seguridad + SMART en practica" },
      { nombre: "Import masivo (Synthea) y analitica (BigQuery)", peso: 10, cubierto: "Tema: GCP (import/export)" },
    ],
    criterios: [
      "Piloto ejecutado: dataset + FHIR store R4 creados y poblados con Synthea.",
      "CRUD completo por REST contra el store, documentado.",
      "Import desde GCS y export a BigQuery ejecutados al menos una vez.",
      "Limpieza final aplicada (costo $0 verificado en facturacion).",
    ],
    enlaces: [
      { titulo: "Google Cloud Healthcare API", url: "https://cloud.google.com/healthcare-api" },
      { titulo: "Capa gratuita de Google Cloud", url: "https://cloud.google.com/free" },
    ],
  },
  {
    paso: 3,
    nombre: "HL7 FHIR Advanced Developer",
    apodo: "La maestria",
    oficial: true,
    umbral: "Aprobado ~65% · objetivo de simulacros: 70%+ · REQUIERE el Foundational aprobado",
    requisito: "Prerrequisito oficial: haber aprobado el Foundational Implementer.",
    descripcion:
      "La certificacion tecnica avanzada de HL7. Este curso siembra sus bases (profiling, busqueda avanzada, SMART, terminologia); tras el Foundational se profundiza con material adicional oficial. Pesos estimados del temario publico:",
    dominios: [
      { nombre: "Profiling y StructureDefinition (slicing, extensions)", peso: 25, cubierto: "Tema: validacion y profiles (base) + estudio adicional" },
      { nombre: "Busqueda avanzada y operaciones ($validate, $everything)", peso: 20, cubierto: "Tema: busqueda avanzada + Laboratorio" },
      { nombre: "Seguridad y SMART on FHIR (App Launch + Backend Services)", peso: 20, cubierto: "Temas: seguridad + SMART en practica" },
      { nombre: "Servicios de terminologia (CodeSystem, ValueSet, ConceptMap)", peso: 15, cubierto: "Tema: terminologias clinicas" },
      { nombre: "Conformidad y CapabilityStatement", peso: 10, cubierto: "Temas: panorama + validacion" },
      { nombre: "Clientes/servidores, Bundles y transacciones", peso: 10, cubierto: "Temas: HTTP/REST + modelo FHIR" },
    ],
    criterios: [
      "Foundational Implementer aprobado (requisito oficial).",
      "Competencia GCP completada (practica real previa).",
      "2 o mas simulacros avanzados >= 70% en dias distintos.",
      "Un IG propio publicado como ejercicio (perfil nacional con SUSHI/FSH).",
    ],
    enlaces: [
      { titulo: "Certificaciones HL7 (incluye Advanced Developer)", url: "https://www.hl7.org/certification/fhir.cfm" },
      { titulo: "FSH / SUSHI (perfilado)", url: "https://fshschool.org/" },
    ],
  },
];

export default function CertificacionesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <Award className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Las 3 rutas de certificacion
          </h1>
          <p className="text-sm text-muted-foreground">
            En este orden. La regla nunca cambia: un tema a la vez, quiz al 80%, tarjetas a
            diario, un simulacro por semana. Agenda examen solo con evidencia, no con
            sensaciones.
          </p>
        </div>
      </header>

      {RUTAS.map((r) => (
        <section key={r.paso} className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sm font-bold text-white">
                {r.paso}
              </span>
              <h2 className="text-lg font-bold">{r.nombre}</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  r.oficial
                    ? "bg-primary-soft text-navy-2"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {r.oficial ? "Examen oficial HL7" : "Competencia practica"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.descripcion}</p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">{r.umbral}</p>
            {r.requisito && (
              <p className="mt-1 text-xs font-semibold text-warning">{r.requisito}</p>
            )}
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-semibold">Dominio</th>
                    <th className="pb-2 pr-3 font-semibold">Peso</th>
                    <th className="pb-2 font-semibold">Donde se cubre aqui</th>
                  </tr>
                </thead>
                <tbody>
                  {r.dominios.map((d, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2 pr-3 font-medium">{d.nombre}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full bg-primary"
                              style={{ width: `${(d.peso / 30) * 100}%` }}
                            />
                          </span>
                          {d.peso}%
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{d.cubierto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <div className="text-sm font-bold">Listo para agendar cuando:</div>
              <ul className="mt-2 flex flex-col gap-1">
                {r.criterios.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {r.enlaces.map((e, i) => (
                <a
                  key={i}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {e.titulo}
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        Nota: HL7 no publica abiertamente el numero exacto de preguntas ni la nota de corte
        vigente; los valores mostrados vienen del material historico y de la guia de
        estudio. Confirmalos en la ficha oficial al inscribirte. Los pesos del Advanced
        Developer son una estimacion basada en el temario publico.
      </p>
    </div>
  );
}
