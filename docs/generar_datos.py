# -*- coding: utf-8 -*-
"""Genera docs/datos.js: el paquete de datos que consume la app (docs/index.html).

Une en un solo archivo JS:
  - evaluacion/temas.json      (mapa de temas y etapas)
  - dias/dia-XX/quiz.json      (quizzes de cada modulo)
  - dias/extra-*/quiz.json     (quiz del modulo extra)
  - evaluacion/flashcards.json (tarjetas Leitner)
  - movil/tema-XX.md           (lecturas de celular)

Correr cada vez que cambie un quiz, una lectura movil o el mapa de temas:

    python docs\\generar_datos.py
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = Path(__file__).resolve().parent / "datos.js"


def leer_json(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def leer_texto(ruta):
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


def main():
    temas = leer_json(RAIZ / "evaluacion" / "temas.json")
    flashcards = leer_json(RAIZ / "evaluacion" / "flashcards.json")

    paquete = {
        "etapas": temas["etapas"],
        "temas": [],
        "flashcards": flashcards,
    }

    for tema in temas["temas"]:
        t = dict(tema)
        # Lectura movil
        ruta_movil = RAIZ / tema["movil"]
        t["lectura"] = leer_texto(ruta_movil) if ruta_movil.exists() else ""
        if not t["lectura"]:
            print(f"  [aviso] sin lectura movil: {tema['movil']}")
        # Quizzes de los modulos del tema
        t["quizzes"] = [q for q in (quiz_de_dia(d) for d in tema["dias"]) if q]
        paquete["temas"].append(t)

    js = "window.LAB_DATA = " + json.dumps(paquete, ensure_ascii=False) + ";\n"
    SALIDA.write_text(js, encoding="utf-8")

    n_quizzes = sum(len(t["quizzes"]) for t in paquete["temas"])
    n_preguntas = sum(len(q["preguntas"]) for t in paquete["temas"] for q in t["quizzes"])
    n_lecturas = sum(1 for t in paquete["temas"] if t["lectura"])
    print(f"OK -> {SALIDA.relative_to(RAIZ)}")
    print(f"  temas: {len(paquete['temas'])} | lecturas: {n_lecturas} | quizzes: {n_quizzes} "
          f"({n_preguntas} preguntas) | tarjetas: {len(flashcards)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
