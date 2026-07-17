"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, Send, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { rol: "user" | "assistant"; contenido: string };
type Limite = { limite: number; usados: number; restantes: number };

export function TutorPanel() {
  const pathname = usePathname();
  const temaSlug = pathname.match(/^\/tema\/([^/]+)/)?.[1];

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | undefined>();
  const [cola, setCola] = useState<string | null>(null);
  const [limite, setLimite] = useState<Limite | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const sinCupo = limite ? limite.restantes <= 0 : false;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Al abrir, consulta cuantas preguntas le quedan hoy al usuario.
  useEffect(() => {
    if (!abierto) return;
    let vivo = true;
    fetch("/api/tutor")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d) setLimite(d as Limite);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [abierto]);

  // Permite que otras partes de la app (ej. remediacion del quiz) abran el tutor
  // con una pregunta precargada: window.dispatchEvent(new CustomEvent("tutor:abrir", {detail:{mensaje}})).
  useEffect(() => {
    function onAbrir(e: Event) {
      const detail = (e as CustomEvent<{ mensaje?: string }>).detail;
      setAbierto(true);
      if (detail?.mensaje) setCola(detail.mensaje);
    }
    window.addEventListener("tutor:abrir", onAbrir);
    return () => window.removeEventListener("tutor:abrir", onAbrir);
  }, []);

  useEffect(() => {
    if (cola && !cargando) {
      const m = cola;
      setCola(null);
      void enviarMensaje(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cola]);

  function enviar() {
    void enviarMensaje(texto.trim());
  }

  async function enviarMensaje(mensaje: string) {
    if (!mensaje || cargando) return;
    setTexto("");
    setMensajes((m) => [...m, { rol: "user", contenido: mensaje }]);
    setCargando(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje, temaSlug, conversacionId }),
      });
      const data = await res.json();
      if (data.limite) setLimite(data.limite as Limite);
      if (!res.ok) throw new Error(data.error ?? "Error");
      setConversacionId(data.conversacionId);
      setMensajes((m) => [...m, { rol: "assistant", contenido: data.respuesta }]);
    } catch (e) {
      setMensajes((m) => [
        ...m,
        { rol: "assistant", contenido: e instanceof Error ? e.message : "No pude responder ahora." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      {/* Boton flotante */}
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Abrir tutor"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {abierto ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        {!abierto && "Tutor"}
      </button>

      {/* Panel */}
      {abierto && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[75vh] max-w-md flex-col rounded-t-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-24 sm:h-[70vh] sm:w-96 sm:rounded-2xl">
          <header className="border-b border-border">
            <div className="flex items-center gap-2 p-3">
              <Bot className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-bold">Tutor de FHIR</div>
                <div className="text-xs text-muted-foreground">
                  {temaSlug ? "Conoce el tema que estas viendo" : "Preguntale lo que quieras"}
                </div>
              </div>
              {limite && (
                <span
                  title={`Preguntas al tutor: ${limite.usados} usadas de ${limite.limite} hoy`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    sinCupo
                      ? "bg-warning-soft text-warning"
                      : "bg-primary-soft text-primary"
                  )}
                >
                  <Zap className="h-3 w-3" />
                  {limite.restantes}/{limite.limite}
                </span>
              )}
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="rounded-md p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            {limite && (
              <div className="h-1 w-full overflow-hidden bg-muted">
                <div
                  className={cn("h-full transition-all", sinCupo ? "bg-warning" : "bg-primary")}
                  style={{
                    width: `${limite.limite ? (limite.restantes / limite.limite) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {mensajes.length === 0 && (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Hola. Soy tu tutor. Preguntame cualquier duda; te guiare paso a paso sin
                darte la respuesta de golpe.
              </p>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-lg p-3 text-sm",
                  m.rol === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.contenido}
              </div>
            ))}
            {cargando && (
              <div className="max-w-[85%] rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Pensando…
              </div>
            )}
            <div ref={finRef} />
          </div>

          {sinCupo && (
            <p className="border-t border-border bg-warning-soft/40 px-3 py-2 text-xs text-warning">
              Llegaste a tu limite de {limite?.limite} preguntas al tutor por hoy. Se reinicia
              manana. Recuerda: el curso esta disenado para completarse sin el tutor.
            </p>
          )}
          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={sinCupo ? "Sin preguntas por hoy" : "Escribe tu pregunta…"}
              disabled={sinCupo}
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={cargando || sinCupo || !texto.trim()}
              aria-label="Enviar"
              className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
