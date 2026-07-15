# -*- coding: utf-8 -*-
"""Genera docs/datos.js: el paquete de datos que consume la app (docs/index.html).

Une en un solo archivo JS:
  - evaluacion/temas.json        (mapa de temas y etapas)
  - dias/dia-XX/quiz.json        (quizzes de cada modulo)
  - dias/extra-*/quiz.json       (quiz del modulo extra)
  - evaluacion/flashcards.json   (tarjetas Leitner)
  - movil/tema-XX.md             (lecturas de celular)
  - PRACTICAS-NACIONALES.md        (practica institucional completa por tema)
  - recursos/enlaces-oficiales.md (pestana Recursos)

Correr cada vez que cambie cualquiera de esas fuentes:

    python docs\\generar_datos.py
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = Path(__file__).resolve().parent / "datos.js"


def leer_json(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def leer_texto(ruta):
    if not ruta.exists():
        return ""
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def quiz_de_dia(dia):
    """dia puede ser un numero (1..20) o un slug de modulo extra."""
    if isinstance(dia, int):
        ruta = RAIZ / "dias" / f"dia-{dia:02d}" / "quiz.json"
    else:
        ruta = RAIZ / "dias" / str(dia) / "quiz.json"
    if not ruta.exists():
        print(f"  [aviso] sin quiz: {ruta.relative_to(RAIZ)}")
        return None
    q = leer_json(ruta)
    q["origen"] = str(dia)
    return q


def practicas_por_tema():
    """Divide PRACTICAS-NACIONALES.md en secciones '## Tema N ...' -> {n: markdown}."""
    texto = leer_texto(RAIZ / "PRACTICAS-NACIONALES.md")
    if not texto:
        return {}
    secciones = {}
    actual, cuerpo = None, []
    for linea in texto.splitlines():
        m = re.match(r"^## Tema (\d+)\b", linea)
        if m:
            if actual is not None:
                secciones[actual] = "\n".join(cuerpo).strip()
            actual, cuerpo = int(m.group(1)), [linea]
        elif linea.startswith("## ") or linea.startswith("# ") or linea.strip() == "---":
            if actual is not None:
                secciones[actual] = "\n".join(cuerpo).strip()
                actual, cuerpo = None, []
        elif actual is not None:
            cuerpo.append(linea)
    if actual is not None:
        secciones[actual] = "\n".join(cuerpo).strip()
    return secciones


def main():
    temas = leer_json(RAIZ / "evaluacion" / "temas.json")
    flashcards = leer_json(RAIZ / "evaluacion" / "flashcards.json")
    practicas = practicas_por_tema()

    paquete = {
        "etapas": temas["etapas"],
        "temas": [],
        "flashcards": flashcards,
        "recursos": leer_texto(RAIZ / "recursos" / "enlaces-oficiales.md"),
    }

    for tema in temas["temas"]:
        t = dict(tema)
        t["lectura"] = leer_texto(RAIZ / tema["movil"])
        if not t["lectura"]:
            print(f"  [aviso] sin lectura movil: {tema['movil']}")
        t["practica_detalle"] = practicas.get(tema["id"], "")
        if not t["practica_detalle"]:
            print(f"  [aviso] sin practica institucional: tema {tema['id']}")
        t["quizzes"] = [q for q in (quiz_de_dia(d) for d in tema["dias"]) if q]
        paquete["temas"].append(t)

    js = "window.LAB_DATA = " + json.dumps(paquete, ensure_ascii=False) + ";\n"
    SALIDA.write_text(js, encoding="utf-8")

    n_quizzes = sum(len(t["quizzes"]) for t in paquete["temas"])
    n_preguntas = sum(len(q["preguntas"]) for t in paquete["temas"] for q in t["quizzes"])
    n_lecturas = sum(1 for t in paquete["temas"] if t["lectura"])
    n_practicas = sum(1 for t in paquete["temas"] if t["practica_detalle"])
    print(f"OK -> {SALIDA.relative_to(RAIZ)}")
    print(f"  temas: {len(paquete['temas'])} | lecturas: {n_lecturas} | practicas: {n_practicas} | "
          f"quizzes: {n_quizzes} ({n_preguntas} preguntas) | tarjetas: {len(flashcards)} | "
          f"recursos: {'si' if paquete['recursos'] else 'no'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
