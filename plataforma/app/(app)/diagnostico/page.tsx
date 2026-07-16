import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Stethoscope, Lightbulb } from "lucide-react";
import { auth } from "@/auth";
import { preguntasAdaptativas, ultimoDiagnostico } from "@/lib/adaptive";
import { registrarDiagnostico } from "@/lib/acciones";
import { Quiz } from "@/components/quiz";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";

export const metadata: Metadata = { title: "Diagnostico" };

export default async function DiagnosticoPage() {
  const sesion = await auth();
  const usuarioId = sesion!.user.id;
  const [preguntas, previo] = await Promise.all([
    preguntasAdaptativas(usuarioId, 10),
    ultimoDiagnostico(usuarioId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <Stethoscope className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Diagnostico inicial</h1>
          <p className="text-sm text-muted-foreground">
            10 preguntas rapidas para saber por donde te conviene empezar. No afecta tu progreso.
          </p>
        </div>
      </header>

      {previo && (
        <Tarjeta className="border-primary/30 bg-primary-soft/40">
          <TarjetaContenido className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-bold">Tu ultimo diagnostico: {previo.porcentaje}%</div>
              <p className="text-sm text-muted-foreground">{previo.recomendacion}</p>
            </div>
          </TarjetaContenido>
        </Tarjeta>
      )}

      <Quiz
        preguntas={preguntas}
        mejorPrevio={null}
        registrar={registrarDiagnostico}
        mostrarMaestria={false}
      />
    </div>
  );
}
