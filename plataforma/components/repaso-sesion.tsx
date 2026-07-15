"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, RotateCcw } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";
import { calificarTarjeta } from "@/lib/acciones";
import type { TarjetaPendiente } from "@/lib/sr";

export function RepasoSesion({ cards }: { cards: TarjetaPendiente[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [mostrada, setMostrada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);

  const carta = cards[idx];

  async function calificar(acierto: boolean) {
    if (acierto) setAciertos((a) => a + 1);
    // Persistimos en segundo plano; no bloqueamos el avance.
    void calificarTarjeta({ tarjetaId: carta.id, acierto });
    if (idx + 1 < cards.length) {
      setIdx((i) => i + 1);
      setMostrada(false);
    } else {
      setTerminado(true);
      router.refresh();
    }
  }

  if (terminado) {
    return (
      <Tarjeta>
        <TarjetaContenido className="flex flex-col items-center gap-2 text-center">
          <Check className="h-7 w-7 text-success" />
          <div className="text-lg font-bold">Repaso terminado</div>
          <p className="text-sm text-muted-foreground">
            {aciertos} de {cards.length} recordadas. Las que fallaste vuelven pronto.
          </p>
          <Boton variante="secundario" tamano="sm" onClick={() => router.refresh()}>
            <RotateCcw className="h-4 w-4" /> Actualizar
          </Boton>
        </TarjetaContenido>
      </Tarjeta>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Tarjeta {idx + 1} / {cards.length}
        </span>
        <span>{carta.temaNombre}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>

      <Tarjeta>
        <TarjetaContenido className="flex min-h-[180px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold">{carta.frente}</p>
          {mostrada ? (
            <>
              <div className="w-full border-t border-border" />
              <p className="text-muted-foreground">{carta.reverso}</p>
            </>
          ) : (
            <Boton variante="secundario" onClick={() => setMostrada(true)}>
              <Eye className="h-4 w-4" /> Mostrar respuesta
            </Boton>
          )}
        </TarjetaContenido>
      </Tarjeta>

      {mostrada && (
        <div className="flex gap-2">
          <Boton variante="peligro" tamano="bloque" onClick={() => calificar(false)}>
            <X className="h-4 w-4" /> No la sabia
          </Boton>
          <Boton tamano="bloque" onClick={() => calificar(true)}>
            <Check className="h-4 w-4" /> La sabia
          </Boton>
        </div>
      )}
    </div>
  );
}
