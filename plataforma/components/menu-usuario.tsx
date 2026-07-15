"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Boton } from "@/components/ui/button";

export function MenuUsuario({
  nombre,
  email,
}: {
  nombre?: string | null;
  email?: string | null;
}) {
  const etiqueta = nombre || email || "Usuario";
  const inicial = etiqueta.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-sm font-semibold leading-tight">{etiqueta}</div>
        {email && (
          <div className="text-xs text-muted-foreground leading-tight">
            {email}
          </div>
        )}
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-sm font-bold text-white">
        {inicial}
      </span>
      <Boton
        variante="fantasma"
        tamano="icono"
        title="Cerrar sesion"
        aria-label="Cerrar sesion"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut />
      </Boton>
    </div>
  );
}
