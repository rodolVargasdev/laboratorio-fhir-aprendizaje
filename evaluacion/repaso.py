r"""Repaso espaciado con cajas de Leitner (para micro-aprendizaje).

Te muestra solo las tarjetas que tocan hoy. Si aciertas, la tarjeta sube de caja
(la veras menos seguido); si fallas, vuelve a la caja 1. Asi vences la curva del
olvido con el minimo esfuerzo, ideal para dias ocupados (5-10 minutos).

Uso:
    python evaluacion\repaso.py            # sesion de repaso de las tarjetas de hoy
    python evaluacion\repaso.py --estado   # muestra cuantas tarjetas hay en cada caja
    python evaluacion\repaso.py --max 15   # limita cuantas tarjetas repasar (micro-sesion)

El mazo de tarjetas esta en evaluacion/flashcards.json.
El progreso se guarda en evaluacion/resultados/leitner_estado.json.
"""

import argparse
import datetime as dt
import json
from pathlib import Path

DIR = Path(__file__).resolve().parent
MAZO = DIR / "flashcards.json"
ESTADO = DIR / "resultados" / "leitner_estado.json"

# Intervalo en dias para cada caja (1 a 5).
INTERVALOS = {1: 1, 2: 2, 3: 4, 4: 7, 5: 15}


def hoy() -> dt.date:
    return dt.date.today()


def cargar_mazo() -> list[dict]:
    with MAZO.open(encoding="utf-8") as f:
        return json.load(f)


def cargar_estado() -> dict:
    if ESTADO.exists():
        with ESTADO.open(encoding="utf-8") as f:
            return json.load(f)
    return {}


def guardar_estado(estado: dict) -> None:
    ESTADO.parent.mkdir(parents=True, exist_ok=True)
    with ESTADO.open("w", encoding="utf-8") as f:
        json.dump(estado, f, ensure_ascii=False, indent=2)


def estado_tarjeta(estado: dict, card_id: str) -> dict:
    if card_id not in estado:
        # Tarjeta nueva: caja 1, vence hoy.
        estado[card_id] = {"caja": 1, "proxima_revision": hoy().isoformat()}
    return estado[card_id]


def vence_hoy(info: dict) -> bool:
    return dt.date.fromisoformat(info["proxima_revision"]) <= hoy()


def mostrar_estado(mazo: list[dict], estado: dict) -> None:
    conteo = {c: 0 for c in INTERVALOS}
    nuevas = 0
    for tarjeta in mazo:
        cid = tarjeta["id"]
        if cid in estado:
            conteo[estado[cid]["caja"]] += 1
        else:
            nuevas += 1
    print("Estado de tu repaso espaciado (cajas de Leitner):")
    print(f"  Tarjetas nuevas (sin estudiar): {nuevas}")
    for caja in sorted(conteo):
        barra = "#" * conteo[caja]
        print(f"  Caja {caja} (cada {INTERVALOS[caja]:>2} dias): {conteo[caja]:>3} {barra}")
    print("\nObjetivo: que la mayoria de tarjetas lleguen a las cajas 4 y 5.")
    print("Eso es evidencia objetiva de retencion a largo plazo.")


def sesion(mazo: list[dict], estado: dict, maximo: int) -> None:
    por_id = {t["id"]: t for t in mazo}
    pendientes = []
    for tarjeta in mazo:
        info = estado_tarjeta(estado, tarjeta["id"])
        if vence_hoy(info):
            pendientes.append(tarjeta["id"])

    if not pendientes:
        print("No tienes tarjetas para repasar hoy. Vuelve manana o estudia un dia nuevo.")
        guardar_estado(estado)
        return

    pendientes = pendientes[:maximo]
    print(f"Tienes {len(pendientes)} tarjeta(s) para repasar hoy.\n")
    print("Lee el frente, intenta recordar la respuesta EN VOZ ALTA, y luego")
    print("presiona Enter para ver el reverso.\n")

    aciertos = 0
    for cid in pendientes:
        tarjeta = por_id[cid]
        info = estado[cid]
        print("=" * 70)
        print(f"[dia {tarjeta.get('dia', '?')} | {tarjeta.get('tema', '')}]")
        print(f"FRENTE: {tarjeta['frente']}")
        input("\n(Enter para ver la respuesta) ")
        print(f"REVERSO: {tarjeta['reverso']}")
        crudo = input("\n.Lo acertaste? (s/n): ").strip().lower()
        if crudo in ("s", "si", "y"):
            aciertos += 1
            info["caja"] = min(5, info["caja"] + 1)
        else:
            info["caja"] = 1
        intervalo = INTERVALOS[info["caja"]]
        info["proxima_revision"] = (hoy() + dt.timedelta(days=intervalo)).isoformat()
        print(f"  -> ahora en caja {info['caja']} (proximo repaso en {intervalo} dias)\n")

    guardar_estado(estado)
    print("=" * 70)
    print(f"Sesion terminada: {aciertos}/{len(pendientes)} acertadas.")
    print("Progreso guardado.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Repaso espaciado (Leitner).")
    parser.add_argument("--estado", action="store_true", help="Muestra el conteo por caja.")
    parser.add_argument("--max", type=int, default=20, help="Maximo de tarjetas por sesion.")
    args = parser.parse_args()

    mazo = cargar_mazo()
    estado = cargar_estado()

    if args.estado:
        mostrar_estado(mazo, estado)
    else:
        sesion(mazo, estado, args.max)


if __name__ == "__main__":
    main()
