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
  Compass,
  FlaskConical,
  Stethoscope,
  Wrench,
  Award,
  CalendarCheck,
  BrainCircuit,
} from "lucide-react";
import { Marca } from "@/components/marca";

export const metadata: Metadata = { title: "Como funciona" };

const PASOS_TEMA = [
  {
    icono: BookOpen,
    t: "1 · Lectura",
    d: "Teoria densa y anclada a la especificacion R4, con un indice lateral para navegarla, recuadros 'en simple', ejemplos reales, errores comunes de examen y una chuleta final. Esta escrita para que domines el tema SIN depender del tutor; los enlaces oficiales son para ahondar todavia mas.",
  },
  {
    icono: Headphones,
    t: "2 · NotebookLM (obligatorio)",
    d: "Llevas el tema a un cuaderno de NotebookLM: la lista te da el nombre exacto del cuaderno, el paquete descargable y las URLs exactas que debes pegar como fuentes (con boton de copiar). Generas el Audio Overview y te tomas un examen oral. Sin esto el tema no se cierra: consolidar en otro formato es parte del metodo.",
  },
  {
    icono: Terminal,
    t: "3 · Practica",
    d: "Ejercicios guiados con resultado esperado: los de REST se hacen aqui mismo en el Laboratorio (peticiones reales a un servidor FHIR publico); los que requieren tu PC traen el setup exacto y los comandos con su salida. Cierra con retos de dificultad creciente y un Reto Feynman (explicarlo con tus palabras).",
  },
  {
    icono: ListChecks,
    t: "4 · Quiz (maestria 80%)",
    d: "12-16 preguntas nivel examen. Si no llegas al 80%, ves exactamente que fallaste, con explicacion, y puedes pedirle al tutor que te lo explique. Reintentas hasta dominarlo: no se avanza con lagunas.",
  },
  {
    icono: Flag,
    t: "5 · Practica nacional",
    d: "Un entregable aplicado a la integracion nacional de salud (El Salvador). Al final del curso, los entregables se unen en una propuesta presentable a tu institucion.",
  },
  {
    icono: Layers,
    t: "6 · Tarjetas",
    d: "Las tarjetas del tema entran a tu calendario de repaso espaciado. Cinco minutos al dia mantienen todo fresco hasta el examen.",
  },
];

const SECCIONES = [
  {
    icono: Compass,
    t: "Ruta (panel principal)",
    d: "Tu mapa: 5 etapas (Prerrequisitos, Fundamentos, Cimientos, El estandar, Practica real) de lo general a lo especifico. Siempre te dice cual es TU siguiente paso y muestra el semaforo de preparacion para el examen.",
  },
  {
    icono: Stethoscope,
    t: "Diagnostico inicial",
    d: "10 preguntas al empezar. Segun tu resultado te recomienda donde arrancar: si ya dominas las bases, saltas los prerrequisitos.",
  },
  {
    icono: FlaskConical,
    t: "Laboratorio",
    d: "Un cliente REST integrado que hace peticiones reales a un servidor FHIR publico (HAPI, R4) desde tu navegador. Aqui se hacen la mayoria de las practicas: sin instalar nada.",
  },
  {
    icono: Layers,
    t: "Repaso (tarjetas)",
    d: "Repeticion espaciada con cajas de Leitner: aciertas y la tarjeta se aleja (1, 2, 4, 7, 15 dias); fallas y vuelve al inicio. La meta es que la mayoria viva en las cajas 4-5: eso es retencion real.",
  },
  {
    icono: Shuffle,
    t: "Simulacro",
    d: "Quizzes intercalados de 15/25/40 preguntas que mezclan todos los temas, como el examen real, priorizando tus puntos debiles. Incluye el modo 'Repaso de fallos': solo las preguntas que aun fallas.",
  },
  {
    icono: Bot,
    t: "Tutor (apoyo, no requisito)",
    d: "Un tutor con IA disponible en toda la app (boton flotante). Conoce el tema que estas viendo y te guia con pistas al estilo socratico. Es un apoyo: el curso esta disenado para completarse sin el.",
  },
  {
    icono: Wrench,
    t: "Setup del workspace",
    d: "La guia paso a paso para preparar tu PC una sola vez (Python, git, entorno virtual, y gcloud para la etapa de Google Cloud). Cada practica de PC te remite aqui.",
  },
  {
    icono: Award,
    t: "Certificaciones",
    d: "Las 3 rutas oficiales en orden: HL7 FHIR Foundational Implementer, competencia practica en Google Cloud Healthcare API, y HL7 FHIR Advanced Developer, con sus dominios, pesos y criterios para agendar.",
  },
];

const METODOS = [
  {
    icono: Target,
    t: "Aprendizaje por maestria",
    d: "No avanzas hasta demostrar dominio (quiz >= 80%). Evita acumular lagunas que luego cuestan el examen.",
  },
  {
    icono: BrainCircuit,
    t: "Recuperacion activa",
    d: "Quizzes, examen oral en NotebookLM y tarjetas: recordar es lo que fija la memoria, no releer.",
  },
  {
    icono: Repeat,
    t: "Repeticion espaciada",
    d: "Repasar justo antes de olvidar (intervalos 1-2-4-7-15 dias) multiplica la retencion por esfuerzo invertido.",
  },
  {
    icono: Shuffle,
    t: "Intercalado",
    d: "Los simulacros mezclan temas para que aprendas a DISCRIMINAR entre conceptos, como exige el examen real.",
  },
  {
    icono: Flag,
    t: "Tecnica Feynman",
    d: "Cada practica te pide explicar el concepto con tus palabras: si no puedes explicarlo simple, aun no lo dominas.",
  },
  {
    icono: CalendarCheck,
    t: "Preparacion medible",
    d: "No decides por sensaciones: el semaforo combina cobertura de temas, promedio de quizzes y retencion. Para agendar examen: 2+ simulacros sobre el umbral en dias distintos y ningun dominio flojo.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Marca className="text-xl" />
        <Link
          href="/panel"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Entrar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight">
        Como funciona RutaFHIR: el recorrido completo
      </h1>
      <p className="mt-2 text-muted-foreground">
        RutaFHIR es una ruta guiada para pasar de cero a experto en HL7 FHIR: primero la
        certificacion <strong>Foundational Implementer</strong>, despues la practica en la
        nube y el <strong>Advanced Developer</strong>, con el objetivo final de que puedas
        dirigir la interoperabilidad FHIR de una institucion. No decides que estudiar: la
        plataforma te lleva paso a paso y te dice, con numeros, cuando dominas cada cosa.
      </p>

      {/* Recorrido por secciones */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">El recorrido, seccion por seccion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto es lo que encontraras dentro y para que sirve cada parte.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {SECCIONES.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <s.icono className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* La clase de cada tema */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Dentro de cada tema: 6 pasos, siempre iguales</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada tema es una clase guiada. El paso pendiente se abre solo; no hay forma de
          perderse.
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          {PASOS_TEMA.map((p, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <p.icono className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold">{p.t}</div>
                <div className="text-sm text-muted-foreground">{p.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Metodologia */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">La metodologia (por que funciona)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No medimos cuanto leiste: medimos cuanto puedes recuperar y aplicar. Cada pieza
          de la plataforma implementa una tecnica con evidencia.
        </p>
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
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div className="font-semibold">Rutina sugerida</div>
          <ul className="mt-2 ml-5 list-disc text-muted-foreground">
            <li>
              <strong>Dias normales (30-60 min):</strong> repaso de tarjetas (5-10 min) +
              avanzar en el tema actual.
            </li>
            <li>
              <strong>Dias sin tiempo (5-15 min):</strong> solo tarjetas desde el celular.
            </li>
            <li>
              <strong>Una vez por semana:</strong> un simulacro de 25 preguntas,
              cronometrado (45 min, sin apuntes), y revisar CADA error.
            </li>
            <li>
              <strong>Para agendar el examen:</strong> 2 o mas simulacros sobre el umbral
              (Foundational: 65%) en dias distintos de las ultimas 2 semanas, sin temas
              flojos. El semaforo del panel te lo dice.
            </li>
          </ul>
        </div>
      </section>

      {/* Celular / PC */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Celular para leer, PC para practicar</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">En el celular</div>
            <p className="text-sm text-muted-foreground">
              Lecturas (con indice), quizzes, tarjetas, NotebookLM (audio) y el tutor. La
              app se puede instalar en la pantalla de inicio.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <Monitor className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">En la PC</div>
            <p className="text-sm text-muted-foreground">
              El Laboratorio rinde mas en pantalla grande, y los temas de Google Cloud y
              scripts requieren la PC. Cada practica de PC empieza con su setup exacto:
              nunca te quedas sin saber que instalar o que comando correr.
            </p>
          </div>
        </div>
      </section>

      {/* Prerrequisitos */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Antes de empezar necesitas</h2>
        <ul className="mt-4 flex flex-col gap-3">
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Una cuenta de Google</div>
              <div className="text-sm text-muted-foreground">
                Para iniciar sesion y para NotebookLM (gratis). En la etapa de nube usaras
                la capa gratuita de Google Cloud, con guia de limpieza para costo cero.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Una PC con navegador</div>
              <div className="text-sm text-muted-foreground">
                No necesitas saber programar: la etapa de Prerrequisitos te da la base
                (terminal, JSON, APIs, Python y SQL) desde cero, con profundidad.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Constancia mas que tiempo</div>
              <div className="text-sm text-muted-foreground">
                30-60 minutos al dia rinden mas que maratones. El material es denso a
                proposito: la meta es maestria, no lectura rapida.
              </div>
            </div>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/panel"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:brightness-95"
        >
          Empezar mi ruta <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="/certificaciones"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold hover:bg-muted"
        >
          Ver las 3 certificaciones <Award className="h-5 w-5" />
        </Link>
      </div>
    </main>
  );
}
