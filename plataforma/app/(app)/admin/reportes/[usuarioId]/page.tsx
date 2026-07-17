import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Minus } from "lucide-react";
import { auth } from "@/auth";
import { detalleEstudiante } from "@/lib/reportes";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle del estudiante" };

const BADGE: Record<string, string> = {
  NO_INICIADO: "bg-muted text-muted-foreground",
  EN_PROGRESO: "bg-primary-soft text-navy-2",
  COMPLETADO: "bg-success-soft text-success",
};
const BADGE_TEXTO: Record<string, string> = {
  NO_INICIADO: "Sin empezar",
  EN_PROGRESO: "En progreso",
  COMPLETADO: "Completado",
};

export default async function DetalleEstudiantePage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  if (sesion.user.rol !== "ADMIN") redirect("/panel");

  const { usuarioId } = await params;
  const detalle = await detalleEstudiante(usuarioId);
  if (!detalle) notFound();

  const { usuario, temas, diagnostico } = detalle;
  const obligatorios = temas.filter((t) => !t.opcional);
  const completados = obligatorios.filter((t) => t.estado === "COMPLETADO").length;
  const feynmanOk = temas.filter((t) => t.feynmanAprobado).length;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/reportes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a reportes
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {usuario!.nombre ?? usuario!.email ?? "Estudiante"}
        </h1>
        <p className="text-sm text-muted-foreground">{usuario!.email}</p>
      </header>

      {/* Resumen del estudiante */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumen etiqueta="Temas completados" valor={`${completados}/${obligatorios.length}`} />
        <Resumen etiqueta="Retos Feynman" valor={String(feynmanOk)} />
        <Resumen
          etiqueta="Diagnostico"
          valor={diagnostico ? `${diagnostico.porcentaje}%` : "-"}
        />
        <Resumen
          etiqueta="Temas con quiz"
          valor={String(temas.filter((t) => t.mejorQuiz != null).length)}
        />
      </div>

      {diagnostico && (
        <Tarjeta>
          <TarjetaContenido className="p-4 text-sm">
            <span className="font-semibold">Diagnostico inicial ({diagnostico.porcentaje}%): </span>
            <span className="text-muted-foreground">{diagnostico.recomendacion}</span>
          </TarjetaContenido>
        </Tarjeta>
      )}

      {/* Desglose por tema */}
      <Tarjeta>
        <TarjetaContenido>
          <div className="text-base font-bold">Progreso por tema</div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Tema</th>
                  <th className="pb-2 pr-3 font-semibold">Estado</th>
                  <th className="pb-2 pr-3 font-semibold">Mejor quiz</th>
                  <th className="pb-2 pr-3 font-semibold">Intentos</th>
                  <th className="pb-2 font-semibold">Feynman</th>
                </tr>
              </thead>
              <tbody>
                {temas.map((t) => (
                  <tr key={t.temaId} className="border-t border-border">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{t.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.etapa}
                        {t.opcional ? " · opcional" : ""}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          BADGE[t.estado] ?? BADGE.NO_INICIADO
                        )}
                      >
                        {BADGE_TEXTO[t.estado] ?? "Sin empezar"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{t.mejorQuiz == null ? "-" : `${t.mejorQuiz}%`}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{t.intentosQuiz}</td>
                    <td className="py-2">
                      {t.feynmanPuntaje == null ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Minus className="h-3.5 w-3.5" /> sin intento
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-semibold",
                            t.feynmanAprobado ? "text-success" : "text-warning"
                          )}
                        >
                          {t.feynmanAprobado && <Check className="h-3.5 w-3.5" />}
                          {t.feynmanPuntaje}/100
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Tarjeta>
      <TarjetaContenido className="p-4">
        <div className="text-2xl font-extrabold tracking-tight">{valor}</div>
        <div className="mt-1 text-xs text-muted-foreground">{etiqueta}</div>
      </TarjetaContenido>
    </Tarjeta>
  );
}
