import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, ChevronRight, Users } from "lucide-react";
import { auth } from "@/auth";
import { obtenerReporte } from "@/lib/reportes";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reportes" };

function fecha(d: Date | null): string {
  if (!d) return "Sin actividad";
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium" }).format(d);
}

export default async function AdminReportesPage() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  if (sesion.user.rol !== "ADMIN") redirect("/panel");

  const { resumen, estudiantes } = await obtenerReporte();

  const kpis = [
    { etiqueta: "Estudiantes", valor: String(resumen.nEstudiantes) },
    {
      etiqueta: "Temas completados (media)",
      valor: `${resumen.promedioTemasCompletados}/${resumen.temasTotal}`,
    },
    {
      etiqueta: "Promedio de quiz",
      valor: resumen.promedioQuiz == null ? "-" : `${resumen.promedioQuiz}%`,
    },
    { etiqueta: "Retencion media", valor: `${resumen.retencionMedia}%` },
    { etiqueta: "Retos Feynman superados", valor: String(resumen.feynmanAprobadosTotal) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Calificaciones y progreso de los estudiantes. Toca un estudiante para ver el detalle.
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Tarjeta key={k.etiqueta}>
            <TarjetaContenido className="p-4">
              <div className="text-2xl font-extrabold tracking-tight">{k.valor}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.etiqueta}</div>
            </TarjetaContenido>
          </Tarjeta>
        ))}
      </div>

      {/* Tabla por estudiante */}
      <Tarjeta>
        <TarjetaContenido>
          <div className="flex items-center gap-2 text-base font-bold">
            <Users className="h-4 w-4 text-primary" /> Estudiantes ({estudiantes.length})
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Estudiante</th>
                  <th className="pb-2 pr-3 font-semibold">Temas</th>
                  <th className="pb-2 pr-3 font-semibold">Prom. quiz</th>
                  <th className="pb-2 pr-3 font-semibold">Retencion</th>
                  <th className="pb-2 pr-3 font-semibold">Feynman</th>
                  <th className="pb-2 pr-3 font-semibold">Ult. actividad</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/40">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/admin/reportes/${e.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {e.nombre ?? e.email ?? "Sin nombre"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{e.email}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {e.temasCompletados}/{e.temasTotal}
                    </td>
                    <td className="py-2 pr-3">
                      {e.promedioQuiz == null ? "-" : `${e.promedioQuiz}%`}
                    </td>
                    <td className="py-2 pr-3">{e.retencion}%</td>
                    <td className="py-2 pr-3">{e.feynmanAprobados}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{fecha(e.ultimaActividad)}</td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/admin/reportes/${e.id}`}
                        className="inline-flex text-muted-foreground hover:text-foreground"
                        aria-label="Ver detalle"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {estudiantes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-3 text-muted-foreground">
                      Aun no hay estudiantes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}
