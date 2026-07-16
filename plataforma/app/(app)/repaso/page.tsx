import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { auth } from "@/auth";
import { tarjetasPendientes, resumenRepaso } from "@/lib/sr";
import { RepasoSesion } from "@/components/repaso-sesion";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";

export const metadata: Metadata = { title: "Repaso" };

export default async function RepasoPage() {
  const sesion = await auth();
  const usuarioId = sesion!.user.id;

  const [pendientes, resumen] = await Promise.all([
    tarjetasPendientes(usuarioId, { limite: 30 }),
    resumenRepaso(usuarioId),
  ]);

  const maxCaja = Math.max(1, ...resumen.porCaja.slice(1));

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Repaso espaciado</h1>
          <p className="text-sm text-muted-foreground">
            Metodo de cajas (Leitner): acierta y la ves menos seguido; falla y vuelve al inicio.
          </p>
        </div>
      </header>

      {pendientes.length > 0 ? (
        <RepasoSesion cards={pendientes} />
      ) : (
        <Tarjeta>
          <TarjetaContenido className="text-center">
            <p className="font-semibold">Estas al dia.</p>
            <p className="text-sm text-muted-foreground">
              No hay tarjetas pendientes por ahora. Vuelve manana o avanza en un tema nuevo.
            </p>
          </TarjetaContenido>
        </Tarjeta>
      )}

      {/* Distribucion de cajas */}
      <Tarjeta>
        <TarjetaContenido>
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm">Tus cajas</strong>
            <span className="text-sm text-muted-foreground">
              {resumen.total} tarjetas · {resumen.pendientes} pendientes
            </span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 90 }}>
            {[1, 2, 3, 4, 5].map((c) => {
              const n = resumen.porCaja[c] ?? 0;
              return (
                <div key={c} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">{n}</span>
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${Math.max((n / maxCaja) * 60, 4)}px` }}
                  />
                  <span className="text-xs text-muted-foreground">Caja {c}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Intervalos: 1, 2, 4, 7 y 15 dias. Meta: que la mayoria viva en las cajas 4-5.
          </p>
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}
