"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Boton } from "@/components/ui/button";

/** Google + correo/contrasena + (solo local) acceso de prueba por correo. */
export function FormularioLogin({
  devHabilitado,
  callbackUrl,
}: {
  devHabilitado: boolean;
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [emailDev, setEmailDev] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<"google" | "password" | "dev" | null>(null);

  const input =
    "h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function entrarConPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando("password");
    const r = await signIn("password", { email, password, redirect: false });
    if (r?.error) {
      setError("Correo o contrasena incorrectos.");
      setCargando(null);
    } else {
      window.location.href = callbackUrl;
    }
  }

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

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> o con tu correo <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-2" onSubmit={entrarConPassword}>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu-correo@correo.com"
          className={input}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contrasena"
          className={input}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Boton type="submit" variante="secundario" tamano="bloque" disabled={cargando !== null}>
          {cargando === "password" ? "Entrando…" : "Entrar con correo"}
        </Boton>
      </form>

      {devHabilitado && (
        <form
          className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setCargando("dev");
            signIn("dev", { email: emailDev, callbackUrl });
          }}
        >
          <label className="text-xs font-semibold text-muted-foreground">
            Acceso de desarrollo (solo local, sin contrasena)
          </label>
          <input
            type="email"
            required
            value={emailDev}
            onChange={(e) => setEmailDev(e.target.value)}
            placeholder="tu-correo@ejemplo.com"
            className={input}
          />
          <Boton type="submit" variante="fantasma" tamano="bloque" disabled={cargando !== null}>
            Entrar sin Google
          </Boton>
        </form>
      )}
    </div>
  );
}
