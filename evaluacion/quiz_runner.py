r"""Motor de evaluacion con recuperacion activa y umbral de maestria.

Mide de forma objetiva si dominaste un dia. Corrige solo, da el desglose por
nivel de la taxonomia de Bloom y un veredicto de maestria (umbral por defecto 80%).
Guarda el historial en evaluacion/resultados/historial.csv.

Uso:
    python evaluacion\quiz_runner.py --dia 1        # quiz de un dia concreto
    python evaluacion\quiz_runner.py --repaso       # mezcla preguntas de varios dias (intercalado)
    python evaluacion\quiz_runner.py --dia 1 --auto # modo demostracion (se responde solo, para verificar)

Formato de cada quiz.json:
{
  "dia": 1,
  "tema": "...",
  "umbral_maestria": 0.8,
  "preguntas": [
    {"id": "d1q1", "bloom": "recordar", "tipo": "opcion_multiple",
     "pregunta": "...", "opciones": ["a", "b", "c"], "respuesta": 1,
     "explicacion": "..."},
    {"id": "d1q2", "bloom": "comprender", "tipo": "verdadero_falso",
     "pregunta": "...", "respuesta": true, "explicacion": "..."},
    {"id": "d1q3", "bloom": "aplicar", "tipo": "respuesta_corta",
     "pregunta": "...", "respuestas_validas": ["...", "..."], "explicacion": "..."}
  ]
}
"""

import argparse
import csv
import datetime as dt
import json
import random
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIR_DIAS = RAIZ / "dias"
DIR_RESULTADOS = Path(__file__).resolve().parent / "resultados"


def carpeta_dia(numero: int) -> Path:
    return DIR_DIAS / f"dia-{numero:02d}"


def cargar_quiz(numero: int) -> dict:
    ruta = carpeta_dia(numero) / "quiz.json"
    if not ruta.exists():
        raise FileNotFoundError(f"No existe el quiz del dia {numero}: {ruta}")
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def cargar_todas_preguntas() -> list[dict]:
    preguntas: list[dict] = []
    for ruta in sorted(DIR_DIAS.glob("dia-*/quiz.json")):
        with ruta.open(encoding="utf-8") as f:
            datos = json.load(f)
        for p in datos.get("preguntas", []):
            p = dict(p)
            p["_dia"] = datos.get("dia")
            preguntas.append(p)
    return preguntas


def normalizar(texto: str) -> str:
    """Normaliza respuestas cortas: minusculas, sin espacios extra ni acentos basicos."""
    texto = texto.strip().lower()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u")):
        texto = texto.replace(a, b)
    return " ".join(texto.split())


def preguntar(p: dict, auto: bool = False) -> bool:
    """Muestra una pregunta, lee la respuesta y devuelve True si es correcta."""
    print("\n" + "-" * 70)
    nivel = p.get("bloom", "?")
    print(f"[Bloom: {nivel}] {p['pregunta']}")
    tipo = p["tipo"]

    if tipo == "opcion_multiple":
        for i, opcion in enumerate(p["opciones"]):
            print(f"  {i + 1}. {opcion}")
        if auto:
            eleccion = p["respuesta"]
        else:
            crudo = input("Tu respuesta (numero): ").strip()
            eleccion = (int(crudo) - 1) if crudo.isdigit() else -1
        correcta = eleccion == p["respuesta"]

    elif tipo == "verdadero_falso":
        print("  (v = verdadero, f = falso)")
        if auto:
            correcta = True
        else:
            crudo = input("Tu respuesta (v/f): ").strip().lower()
            valor = crudo in ("v", "verdadero", "true", "t", "si")
            correcta = valor == bool(p["respuesta"])

    elif tipo == "respuesta_corta":
        validas = [normalizar(r) for r in p["respuestas_validas"]]
        if auto:
            correcta = True
        else:
            crudo = input("Tu respuesta: ")
            correcta = normalizar(crudo) in validas

    else:
        print(f"(Tipo de pregunta no soportado: {tipo}; se omite)")
        return True

    if correcta:
        print("Correcto.")
    else:
        print("Incorrecto.")
        if tipo == "opcion_multiple":
            print(f"  Respuesta correcta: {p['opciones'][p['respuesta']]}")
        elif tipo == "verdadero_falso":
            print(f"  Respuesta correcta: {'verdadero' if p['respuesta'] else 'falso'}")
        elif tipo == "respuesta_corta":
            print(f"  Respuesta aceptada: {p['respuestas_validas'][0]}")
    if p.get("explicacion"):
        print(f"  Por que: {p['explicacion']}")
    return correcta


def guardar_resultado(etiqueta: str, aciertos: int, total: int, porcentaje: float) -> None:
    DIR_RESULTADOS.mkdir(parents=True, exist_ok=True)
    archivo = DIR_RESULTADOS / "historial.csv"
    nuevo = not archivo.exists()
    with archivo.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if nuevo:
            writer.writerow(["fecha", "quiz", "aciertos", "total", "porcentaje"])
        writer.writerow([
            dt.datetime.now().isoformat(timespec="seconds"),
            etiqueta, aciertos, total, f"{porcentaje:.0f}",
        ])


def ejecutar(preguntas: list[dict], etiqueta: str, umbral: float, auto: bool) -> None:
    if not preguntas:
        print("No hay preguntas para evaluar.")
        return

    print("=" * 70)
    print(f"QUIZ: {etiqueta}  ({len(preguntas)} preguntas)")
    print("Responde de memoria. El esfuerzo de recordar es lo que te hace aprender.")

    aciertos = 0
    por_bloom: dict[str, list[int]] = {}
    fallos: list[dict] = []
    for p in preguntas:
        ok = preguntar(p, auto=auto)
        nivel = p.get("bloom", "?")
        marca = por_bloom.setdefault(nivel, [0, 0])
        marca[1] += 1
        if ok:
            aciertos += 1
            marca[0] += 1
        else:
            fallos.append(p)

    total = len(preguntas)
    porcentaje = 100 * aciertos / total

    print("\n" + "=" * 70)
    print(f"RESULTADO: {aciertos}/{total} = {porcentaje:.0f}%")
    print("\nDesglose por nivel de Bloom:")
    for nivel, (ok, tot) in sorted(por_bloom.items()):
        print(f"  - {nivel:12s}: {ok}/{tot}")

    print("\nVeredicto:")
    if porcentaje >= 90:
        print("  Dominio solido (>=90%). Avanza con confianza.")
    elif porcentaje >= umbral * 100:
        print(f"  Maestria alcanzada (>={umbral * 100:.0f}%). Avanza y repasa lo fallado.")
    elif porcentaje >= 60:
        print("  Aun no hay maestria. Repasa lo fallado y reintenta manana.")
    else:
        print("  Rehacer la leccion y la practica antes de reintentar.")

    if fallos:
        print("\nPara repasar (lo que fallaste):")
        for p in fallos:
            origen = f"dia {p['_dia']} - " if "_dia" in p else ""
            print(f"  - {origen}{p['pregunta']}")

    guardar_resultado(etiqueta, aciertos, total, porcentaje)
    print(f"\nResultado guardado en {DIR_RESULTADOS / 'historial.csv'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Quiz de maestria con recuperacion activa.")
    grupo = parser.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--dia", type=int, help="Numero de dia a evaluar (1-14).")
    grupo.add_argument("--repaso", action="store_true", help="Mezcla preguntas de varios dias (intercalado).")
    parser.add_argument("--n", type=int, default=10, help="Numero de preguntas en modo repaso.")
    parser.add_argument("--auto", action="store_true", help="Modo demostracion: se responde solo.")
    args = parser.parse_args()

    if args.repaso:
        todas = cargar_todas_preguntas()
        random.shuffle(todas)
        seleccion = todas[: args.n]
        ejecutar(seleccion, "repaso intercalado", umbral=0.8, auto=args.auto)
    else:
        quiz = cargar_quiz(args.dia)
        umbral = float(quiz.get("umbral_maestria", 0.8))
        etiqueta = f"dia {quiz.get('dia', args.dia)} - {quiz.get('tema', '')}"
        ejecutar(quiz["preguntas"], etiqueta, umbral=umbral, auto=args.auto)


if __name__ == "__main__":
    main()
