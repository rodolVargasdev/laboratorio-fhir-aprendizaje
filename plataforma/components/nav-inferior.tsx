"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Layers, Shuffle, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/panel", etiqueta: "Ruta", icono: Compass },
  { href: "/laboratorio", etiqueta: "Lab", icono: FlaskConical },
  { href: "/repaso", etiqueta: "Repaso", icono: Layers },
  { href: "/simulacro", etiqueta: "Simulacro", icono: Shuffle },
];

export function NavInferior() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-semibold transition-colors",
                activo ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icono className="h-5 w-5" />
              {item.etiqueta}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
