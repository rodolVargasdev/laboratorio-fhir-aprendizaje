"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw, Trophy, Bot } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PreguntaQuiz = {
  id: string;
  tipo: "OPCION_MULTIPLE" | "VERDADERO_FALSO" | "RESPUESTA_CORTA";
  enunciado: string;
  opciones: string[] | null;
  respuestaIndice: number | null;
  respuestaBool: boolean | null;
  respuestasValidas: string[];
  explicacion: string | null;
};

const UMBRAL = 80;

function normalizar(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

function barajar<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

type Revision = { pregunta: string; correcto: boolean; correcta: string; explicacion: string };

export function Quiz({
  preguntas,
  mejorPrevio,
  registrar,
  mostrarMaestria = true,
}: {
  preguntas: PreguntaQuiz[];
  mejorPrevio: number | null;
  registrar: (
    detalle: { preguntaId: string; correcto: boolean }[]
  ) => Promise<{ porcentaje: number; aprobado?: boolean }>;
  mostrarMaestria?: boolean;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<"inicio" | "pregunta" | "final">("inicio");
  const [orden, setOrden] = useState<PreguntaQuiz[]>([]);
  const [idx, setIdx] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [revision, setRevision] = useState<Revision[]>([]);
  const [detalle, setDetalle] = useState<{ preguntaId: string; correcto: boolean }[]>([]);
  const [respondida, setRespondida] = useState<null | { correcto: boolean; correcta: string }>(null);
  const [textoCorto, setTextoCorto] = useState("");
  const [resultado, setResultado] = useState<{ porcentaje: number; aprobado: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);

  function iniciar() {
    setOrden(barajar(preguntas));
    setIdx(0);
    setAciertos(0);
    setRevision([]);
    setDetalle([]);
    setRespondida(null);
    setTextoCorto("");
    setResultado(null);
    setFase("pregunta");
  }

  const p = orden[idx];

  function responder(valor: number | boolean | string) {
    if (respondida) return;
    let correcto = false;
    let correcta = "";
    if (p.tipo === "OPCION_MULTIPLE") {
      correcto = valor === p.respuestaIndice;
      correcta = p.opciones?.[p.respuestaIndice ?? 0] ?? "";
    } else if (p.tipo === "VERDADERO_FALSO") {
      correcto = valor === p.respuestaBool;
      correcta = p.respuestaBool ? "Verdadero" : "Falso";
    } else {
      const validas = p.respuestasValidas.map(normalizar);
      correcto = validas.includes(normalizar(String(valor)));
      correcta = p.respuestasValidas[0] ?? "";
    }
    setRespondida({ correcto, correcta });
    if (correcto) setAciertos((a) => a + 1);
    setDetalle((d) => [...d, { preguntaId: p.id, correcto }]);
    setRevision((r) => [
      ...r,
      { pregunta: p.enunciado, correcto, correcta, explicacion: p.explicacion ?? "" },
    ]);
  }

  async function siguiente() {
    setRespondida(null);
    setTextoCorto("");
    if (idx + 1 < orden.length) {
      setIdx((i) => i + 1);
    } else {
      setGuardando(true);
      const r = await registrar(detalle);
      setResultado({ porcentaje: r.porcentaje, aprobado: !!r.aprobado });
      setGuardando(false);
      setFase("final");
      router.refresh();
    }
  }

  if (fase === "inicio") {
    return (
      <Tarjeta>
        <TarjetaContenido className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {preguntas.length} preguntas.
            {mostrarMaestria && (
              <>
                {" "}
                Meta de maestria: <strong>{UMBRAL}%</strong>.
              </>
            )}
            {mejorPrevio != null && ` Tu mejor resultado: ${mejorPrevio}%.`}
          </p>
          <Boton onClick={iniciar} disabled={!preguntas.length}>
            {mostrarMaestria ? (mejorPrevio != null ? "Reintentar quiz" : "Empezar quiz") : "Empezar simulacro"}
          </Boton>
        </TarjetaContenido>
      </Tarjeta>
    );
  }

  if (fase === "pregunta" && p) {
    const avance = `${idx + 1} / ${orden.length}`;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Pregunta {avance}</span>
          <span>{aciertos} correctas</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(idx / orden.length) * 100}%` }} />
        </div>
        <Tarjeta>
          <TarjetaContenido className="flex flex-col gap-4">
            <p className="font-semibold">{p.enunciado}</p>

            {p.tipo === "OPCION_MULTIPLE" && (
              <div className="flex flex-col gap-2">
                {(p.opciones ?? []).map((o, i) => {
                  const esCorrecta = respondida && i === p.respuestaIndice;
                  const esElegidaMal = respondida && !respondida.correcto && i !== p.respuestaIndice;
                  return (
                    <button
                      key={i}
                      disabled={!!respondida}
                      onClick={() => responder(i)}
                      className={cn(
                        "rounded-md border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted disabled:cursor-default",
                        esCorrecta && "border-success bg-success-soft",
                        esElegidaMal && "opacity-60"
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            )}

            {p.tipo === "VERDADERO_FALSO" && (
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    disabled={!!respondida}
                    onClick={() => responder(v)}
                    className={cn(
                      "flex-1 rounded-md border border-border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-default",
                      respondida && v === p.respuestaBool && "border-success bg-success-soft"
                    )}
                  >
                    {v ? "Verdadero" : "Falso"}
                  </button>
                ))}
              </div>
            )}

            {p.tipo === "RESPUESTA_CORTA" && (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!respondida) responder(textoCorto);
                }}
              >
                <input
                  value={textoCorto}
                  onChange={(e) => setTextoCorto(e.target.value)}
                  disabled={!!respondida}
                  placeholder="Escribe tu respuesta…"
                  className="h-11 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {!respondida && <Boton type="submit" variante="secundario">Responder</Boton>}
              </form>
            )}

            {respondida && (
              <div
                className={cn(
                  "rounded-md p-3 text-sm",
                  respondida.correcto ? "bg-success-soft text-foreground" : "bg-danger-soft text-foreground"
                )}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {respondida.correcto ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {respondida.correcto ? "Correcto" : "Incorrecto"}
                </div>
                {!respondida.correcto && (
                  <p className="mt-1">
                    Respuesta: <strong>{respondida.correcta}</strong>
                  </p>
                )}
                {p.explicacion && <p className="mt-1 text-muted-foreground">{p.explicacion}</p>}
                <Boton className="mt-3" tamano="sm" onClick={siguiente} disabled={guardando}>
                  {idx + 1 < orden.length ? "Siguiente" : guardando ? "Guardando…" : "Ver resultado"}
                </Boton>
              </div>
            )}
          </TarjetaContenido>
        </Tarjeta>
      </div>
    );
  }

  // final
  const pct = resultado?.porcentaje ?? 0;
  const aprobado = resultado?.aprobado ?? false;
  const fallos = revision.filter((r) => !r.correcto);
  return (
    <div className="flex flex-col gap-4">
      <Tarjeta className={aprobado ? "border-success/40" : "border-danger/40"}>
        <TarjetaContenido className="flex flex-col items-center gap-2 text-center">
          <Trophy className={cn("h-7 w-7", aprobado ? "text-success" : "text-muted-foreground")} />
          <div className="text-4xl font-extrabold">{pct}%</div>
          <p className="text-sm text-muted-foreground">
            {aciertos} de {orden.length} correctas
          </p>
          {mostrarMaestria ? (
            <p className={cn("font-semibold", aprobado ? "text-success" : "text-danger")}>
              {aprobado
                ? "Maestria alcanzada. Este paso queda completado."
                : `Aun no llegas al ${UMBRAL}%. Repasa lo fallado y reintenta.`}
            </p>
          ) : (
            <p className="font-semibold text-muted-foreground">
              Simulacro terminado. Lo fallado alimenta tu repaso.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Boton variante="secundario" tamano="sm" onClick={iniciar}>
              <RotateCcw className="h-4 w-4" /> Reintentar
            </Boton>
          </div>
        </TarjetaContenido>
      </Tarjeta>

      {fallos.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-muted-foreground">Repasa esto</h3>
          {fallos.map((r, i) => (
            <Tarjeta key={i}>
              <TarjetaContenido>
                <p className="font-semibold">{r.pregunta}</p>
                <p className="mt-1 text-sm">
                  Respuesta: <strong>{r.correcta}</strong>
                </p>
                {r.explicacion && <p className="mt-1 text-sm text-muted-foreground">{r.explicacion}</p>}
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  className="mt-2"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("tutor:abrir", {
                        detail: { mensaje: `No entendi esta pregunta: "${r.pregunta}". Puedes explicarmela?` },
                      })
                    )
                  }
                >
                  <Bot className="h-4 w-4" /> Explicamelo al tutor
                </Boton>
              </TarjetaContenido>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
