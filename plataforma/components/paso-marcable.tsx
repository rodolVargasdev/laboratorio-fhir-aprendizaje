"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { marcarPaso } from "@/lib/acciones";

/** Boton para marcar/desmarcar un paso manual (lectura, practica, etc.). */
export function PasoMarcable({
  pasoId,
  temaId,
  temaSlug,
  completado,
  etiqueta = "Marcar como hecho",
}: {
  pasoId: string;
  temaId: string;
  temaSlug: string;
  completado: boolean;
  etiqueta?: string;
}) {
  const router = useRouter();
  const [hecho, setHecho] = useState(completado);
  const [pendiente, startTransition] = useTransition();

  function alternar() {
    const nuevo = !hecho;
    setHecho(nuevo);
    startTransition(async () => {
      await marcarPaso({ pasoId, temaId, temaSlug, completado: nuevo });
      router.refresh();
    });
  }

  return (
    <Boton
      variante={hecho ? "secundario" : "primario"}
      tamano="sm"
      onClick={alternar}
      disabled={pendiente}
    >
      {hecho ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {hecho ? "Hecho" : etiqueta}
    </Boton>
  );
}
