import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Terminal,
  ListChecks,
  Flag,
  Layers,
  Bot,
  Repeat,
  Shuffle,
  Target,
  Smartphone,
  Monitor,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Marca } from "@/components/marca";

export const metadata: Metadata = { title: "Como funciona" };

const PASOS = [
  { icono: BookOpen, t: "Lectura", d: "Lees el tema en el celular o el navegador. Con recuadros 'en simple' y enlaces a la documentacion oficial." },
  { icono: Headphones, t: "NotebookLM", d: "Paso obligatorio: llevas el material a un cuaderno de NotebookLM (audio, preguntas). No cierras el tema sin esto." },
  { icono: Terminal, t: "Practica", d: "Ejercicios: algunos aqui en el sitio, otros en tu PC (siempre con el setup explicado)." },
  { icono: ListChecks, t: "Quiz", d: "Te evaluas. Necesitas 80% para dominar el tema; si no, repasas lo fallado y reintentas." },
  { icono: Flag, t: "Practica nacional", d: "Un entregable aplicado a la integracion nacional de salud." },
  { icono: Layers, t: "Tarjetas", d: "Repaso espaciado diario para que no se te olvide." },
];

const METODOS = [
  { icono: Target, t: "Aprendizaje por maestria", d: "No avanzas hasta dominar (quiz >= 80%)." },
  { icono: ListChecks, t: "Recuperacion activa", d: "Te pones a prueba, no solo lees." },
  { icono: Repeat, t: "Repeticion espaciada", d: "Repasas en intervalos crecientes (cajas Leitner)." },
  { icono: Shuffle, t: "Intercalado", d: "Simulacros que mezclan temas, como el examen real." },
  { icono: Bot, t: "Tutor con IA", d: "Te guia con pistas (metodo socratico), no te da la respuesta de golpe." },
];

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Marca className="text-xl" />
        <Link href="/panel" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Entrar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight">Como funciona RutaFHIR</h1>
      <p className="mt-2 text-muted-foreground">
        Una ruta guiada para aprender el estandar HL7 FHIR desde cero hasta nivel de examen,
        a tu ritmo. Lees donde quieras, practicas cuando puedas y el sistema te dice con
        numeros cuando dominas cada tema.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Cada tema, siempre igual: 6 pasos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No tienes que decidir que estudiar. Abres el tema y sigues los pasos de arriba
          hacia abajo.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PASOS.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <p.icono className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold">{i + 1}. {p.t}</div>
                <div className="text-sm text-muted-foreground">{p.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Por que funciona (metodologia con evidencia)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {METODOS.map((m, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <m.icono className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
              <div>
                <div className="font-semibold">{m.t}</div>
                <div className="text-sm text-muted-foreground">{m.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Celular para leer, PC para practicar</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">En el celular</div>
            <p className="text-sm text-muted-foreground">
              Lecturas, quizzes, tarjetas y el tutor. Puedes instalar la app en tu pantalla
              de inicio (Anadir a pantalla de inicio).
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <Monitor className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">En la PC</div>
            <p className="text-sm text-muted-foreground">
              Los ejercicios que tocan servidores FHIR o Google Cloud. Cada uno trae el
              setup inicial paso a paso; nunca te quedas sin saber que instalar.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Antes de empezar necesitas</h2>
        <ul className="mt-4 flex flex-col gap-3">
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Una cuenta de Google</div>
              <div className="text-sm text-muted-foreground">
                Para iniciar sesion y para usar NotebookLM (gratis).
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Una PC con navegador</div>
              <div className="text-sm text-muted-foreground">
                Para los ejercicios practicos. No necesitas saber programar: empezamos en el
                nivel de Prerrequisitos (terminal, JSON, APIs, Python y SQL en version amable).
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Ganas de dominar, no solo de leer</div>
              <div className="text-sm text-muted-foreground">
                El objetivo es maestria: material denso, quizzes exigentes y practica real.
              </div>
            </div>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex justify-center">
        <Link
          href="/panel"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:brightness-95"
        >
          Empezar mi ruta <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </main>
  );
}
