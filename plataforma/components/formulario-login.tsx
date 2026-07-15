"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Boton } from "@/components/ui/button";

/** Boton de Google + (solo en desarrollo) acceso de prueba por correo. */
export function FormularioLogin({
  devHabilitado,
  callbackUrl,
}: {
  devHabilitado: boolean;
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState<"google" | "dev" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Boton
        tamano="bloque"
        disabled={cargando !== null}
        onClick={() => {
          setCargando("google");
          signIn("google", { callbackUrl });
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.4-1.64 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.99 3.6 14.86 2.7 12.18 2.7 7.03 2.7 2.86 6.86 2.86 12s4.17 9.3 9.32 9.3c5.38 0 8.94-3.78 8.94-9.11 0-.61-.07-1.08-.17-1.09z"
          />
        </svg>
        {cargando === "google" ? "Redirigiendo…" : "Continuar con Google"}
      </Boton>

      {devHabilitado && (
        <form
          className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setCargando("dev");
            signIn("dev", { email, callbackUrl });
          }}
        >
          <label className="text-xs font-semibold text-muted-foreground">
            Acceso de desarrollo (solo local)
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu-correo@ejemplo.com"
            className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Boton
            type="submit"
            variante="secundario"
            tamano="bloque"
            disabled={cargando !== null}
          >
            Entrar sin Google
          </Boton>
        </form>
      )}
    </div>
  );
}
