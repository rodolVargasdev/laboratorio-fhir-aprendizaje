r"""Calculador de PREPARACION objetivo para las 3 metas de certificacion.

Responde con numeros (no con sensaciones) a: .estoy aprendiendo? .estoy listo?

Metodo (respaldado por investigacion sobre prediccion de aprobado en examenes):
una sola nota de simulacro enganha. La preparacion real es un PUNTAJE COMPUESTO que
combina varias senales y una COMPUERTA con reglas estrictas.

Puntaje compuesto (0-100), pesos basados en la literatura de readiness:
  - 35%  Cobertura por dominio (que TODOS los dominios del exam esten sobre el umbral)
  - 25%  Promedio de simulacros recientes
  - 15%  Tendencia (mejoras o te estancas)
  - 15%  Frecuencia de sesiones (constancia ultimos 14 dias)
  - 10%  Retencion (que tan reciente fue tu ultima sesion; decae con el tiempo)

Compuerta "LISTO PARA EXAMEN" (deben cumplirse TODAS):
  1. Puntaje compuesto >= 75
  2. Ningun dominio por debajo de 60
  3. Al menos 2 simulacros en dias distintos (ultimos 14 dias) que superen el
     umbral del examen por al menos su margen objetivo (p.ej. Foundational 60 -> 65)

Fuentes de datos (se generan solos al estudiar):
  - evaluacion/resultados/historial.csv  (lo escribe quiz_runner.py)
  - evaluacion/competencias.json         (lo actualizas tu/Composer con evidencia)
  - evaluacion/blueprints.json           (dominios y pesos de cada certificacion)

Uso:
    python evaluacion\preparacion.py                 # tablero de las 3 metas
    python evaluacion\preparacion.py --cert foundational
    python evaluacion\preparacion.py --detalle       # muestra el desglose completo
"""

import argparse
import csv
import datetime as dt
import json
import re
import statistics
from pathlib import Path

DIR = Path(__file__).resolve().parent
BLUEPRINTS = DIR / "blueprints.json"
COMPETENCIAS = DIR / "competencias.json"
HISTORIAL = DIR / "resultados" / "historial.csv"

HOY = dt.date.today()
VENTANA_DIAS = 14          # ventana para constancia y simulacros recientes
RECIENTE_DIAS = 90         # cuan atras consideramos una nota de quiz aun valida
SESIONES_OBJETIVO = 8      # sesiones en 14 dias = constancia plena


def cargar_json(ruta: Path) -> dict:
    if not ruta.exists():
        return {}
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def cargar_historial() -> list[dict]:
    if not HISTORIAL.exists():
        return []
    filas = []
    with HISTORIAL.open(encoding="utf-8-sig") as f:
        for fila in csv.DictReader(f):
            try:
                fecha = dt.datetime.fromisoformat(fila["fecha"]).date()
                pct = float(fila["porcentaje"])
            except (ValueError, KeyError):
                continue
            filas.append({"fecha": fecha, "quiz": fila.get("quiz", ""), "pct": pct})
    return filas


def dia_de(label: str) -> int | None:
    m = re.search(r"dia\s+(\d+)", label.lower())
    return int(m.group(1)) if m else None


def es_simulacro(label: str) -> bool:
    l = label.lower()
    return "repaso" in l or "simulacro" in l or "examen final" in l or "acumulado" in l


def nota_por_dominio(dominio: dict, historial: list[dict], competencias: dict) -> tuple[float, str]:
    """Nota de un dominio = el MAYOR entre: mejor quiz reciente de sus dias, y la
    competencia registrada manualmente con evidencia."""
    dias = set(dominio.get("dias", []))
    limite = HOY - dt.timedelta(days=RECIENTE_DIAS)
    notas_quiz = [
        f["pct"] for f in historial
        if f["fecha"] >= limite and dia_de(f["quiz"]) in dias
    ]
    mejor_quiz = max(notas_quiz) if notas_quiz else 0.0

    registro = competencias.get(dominio["clave"], {})
    manual = float(registro.get("score", 0) or 0)

    if mejor_quiz >= manual:
        return mejor_quiz, "quiz"
    return manual, "registro"


def simulacros_recientes(historial: list[dict]) -> list[dict]:
    limite = HOY - dt.timedelta(days=VENTANA_DIAS)
    return [f for f in historial if es_simulacro(f["quiz"]) and f["fecha"] >= limite]


def calcular_tendencia(historial: list[dict]) -> float:
    """Compara el promedio de simulacros recientes vs los anteriores.
    Devuelve 0-100: subiendo/estable=100, leve caida=60, caida fuerte=30."""
    sims = sorted([f for f in historial if es_simulacro(f["quiz"])], key=lambda x: x["fecha"])
    if len(sims) < 2:
        return 50.0  # sin evidencia suficiente: neutro
    mitad = len(sims) // 2
    viejo = statistics.mean(f["pct"] for f in sims[:mitad])
    nuevo = statistics.mean(f["pct"] for f in sims[mitad:])
    delta = nuevo - viejo
    if delta >= -1:
        return 100.0
    if delta >= -8:
        return 60.0
    return 30.0


def frecuencia_sesiones(historial: list[dict]) -> float:
    limite = HOY - dt.timedelta(days=VENTANA_DIAS)
    dias_distintos = {f["fecha"] for f in historial if f["fecha"] >= limite}
    return min(100.0, 100.0 * len(dias_distintos) / SESIONES_OBJETIVO)


def retencion(historial: list[dict]) -> float:
    if not historial:
        return 0.0
    ultima = max(f["fecha"] for f in historial)
    dias = (HOY - ultima).days
    return max(0.0, 100.0 - 3.0 * dias)  # decae 3 puntos por dia sin estudiar


def evaluar_cert(clave: str, cert: dict, historial: list[dict], competencias: dict) -> dict:
    dominios = []
    for d in cert["dominios"]:
        nota, origen = nota_por_dominio(d, historial, competencias)
        dominios.append({"nombre": d["nombre"], "peso": d["peso"], "nota": nota, "origen": origen})

    peso_total = sum(d["peso"] for d in dominios) or 1
    cobertura = sum(d["nota"] * d["peso"] for d in dominios) / peso_total

    sims = simulacros_recientes(historial)
    prom_sim = statistics.mean(f["pct"] for f in sims) if sims else 0.0
    tendencia = calcular_tendencia(historial)
    frecuencia = frecuencia_sesiones(historial)
    reten = retencion(historial)

    compuesto = (
        0.35 * cobertura
        + 0.25 * prom_sim
        + 0.15 * tendencia
        + 0.15 * frecuencia
        + 0.10 * reten
    )

    umbral = cert["umbral_aprobado"]
    margen = cert.get("margen_objetivo", 5)
    objetivo_sim = umbral + margen

    # Compuerta
    dominio_min = min((d["nota"] for d in dominios), default=0)
    sims_buenos = [f for f in sims if f["pct"] >= objetivo_sim]
    dias_sims_buenos = {f["fecha"] for f in sims_buenos}
    regla_simulacros = len(dias_sims_buenos) >= 2

    if cert.get("es_examen_oficial", True):
        listo = compuesto >= 75 and dominio_min >= 60 and regla_simulacros
    else:
        # GCP no es examen: compuerta por competencia practica
        listo = cobertura >= cert["umbral_aprobado"] and dominio_min >= 60

    return {
        "nombre": cert["nombre"],
        "compuesto": compuesto,
        "cobertura": cobertura,
        "prom_sim": prom_sim,
        "tendencia": tendencia,
        "frecuencia": frecuencia,
        "retencion": reten,
        "dominios": dominios,
        "dominio_min": dominio_min,
        "umbral": umbral,
        "objetivo_sim": objetivo_sim,
        "sims_recientes": len(sims),
        "sims_buenos_dias": len(dias_sims_buenos),
        "regla_simulacros": regla_simulacros,
        "es_oficial": cert.get("es_examen_oficial", True),
        "listo": listo,
    }


def barra(valor: float, ancho: int = 20) -> str:
    llenos = int(round(ancho * valor / 100))
    return "[" + "#" * llenos + "-" * (ancho - llenos) + f"] {valor:5.1f}"


def semaforo(r: dict) -> str:
    if r["listo"]:
        return "VERDE  - LISTO para agendar"
    if r["compuesto"] >= 55:
        return "AMARILLO - cerca; cierra brechas"
    return "ROJO   - sigue estudiando"


def imprimir_cert(clave: str, r: dict, detalle: bool) -> None:
    print("=" * 72)
    print(r["nombre"])
    print("-" * 72)
    print(f"  PUNTAJE DE PREPARACION : {barra(r['compuesto'])}")
    print(f"  Estado                 : {semaforo(r)}")
    print(f"  Cobertura por dominio  : {barra(r['cobertura'])}")
    print(f"  Promedio simulacros    : {barra(r['prom_sim'])}  (objetivo >= {r['objetivo_sim']:.0f})")
    if detalle:
        print(f"  Tendencia              : {barra(r['tendencia'])}")
        print(f"  Constancia (14 dias)   : {barra(r['frecuencia'])}")
        print(f"  Retencion (reciente)   : {barra(r['retencion'])}")
        print("  Dominios:")
        for d in r["dominios"]:
            alerta = "  <-- DEBAJO DE 60" if d["nota"] < 60 else ""
            print(f"    - {d['nombre'][:46]:46s} {barra(d['nota'], 12)}{alerta}")

    print("  Compuerta LISTO (deben cumplirse todas):")
    if r["es_oficial"]:
        print(f"    [{'x' if r['compuesto'] >= 75 else ' '}] puntaje compuesto >= 75 (tienes {r['compuesto']:.0f})")
        print(f"    [{'x' if r['dominio_min'] >= 60 else ' '}] ningun dominio < 60 (minimo actual {r['dominio_min']:.0f})")
        print(f"    [{'x' if r['regla_simulacros'] else ' '}] 2+ simulacros >= {r['objetivo_sim']:.0f} en dias distintos (tienes {r['sims_buenos_dias']})")
    else:
        print(f"    [{'x' if r['cobertura'] >= r['umbral'] else ' '}] competencia practica >= {r['umbral']:.0f} (tienes {r['cobertura']:.0f})")
        print(f"    [{'x' if r['dominio_min'] >= 60 else ' '}] ningun dominio < 60 (minimo actual {r['dominio_min']:.0f})")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculador de preparacion para certificaciones FHIR.")
    parser.add_argument("--cert", choices=["foundational", "gcp", "advanced"], help="Solo una meta.")
    parser.add_argument("--detalle", action="store_true", help="Muestra el desglose completo.")
    args = parser.parse_args()

    bp = cargar_json(BLUEPRINTS).get("certificaciones", {})
    comp = cargar_json(COMPETENCIAS).get("competencias", {})
    hist = cargar_historial()

    if not bp:
        print("No se encontro blueprints.json. No puedo calcular la preparacion.")
        return

    print("\nTABLERO DE PREPARACION PARA CERTIFICACION FHIR")
    print(f"Fecha: {HOY.isoformat()}  |  Sesiones registradas: {len({f['fecha'] for f in hist})}")
    if not hist:
        print("\n(Aun no hay datos en historial.csv. Haz quizzes con quiz_runner.py")
        print(" y registra competencias con evidencia en competencias.json.)\n")

    claves = [args.cert] if args.cert else ["foundational", "gcp", "advanced"]
    print()
    for clave in claves:
        if clave in bp:
            r = evaluar_cert(clave, bp[clave], hist, comp)
            imprimir_cert(clave, r, args.detalle or bool(args.cert))

    print("Consejo: corre esto cada semana. Sube cuando haces quizzes y simulacros,")
    print("y BAJA si dejas de estudiar (la retencion decae). Es una senal honesta.")


if __name__ == "__main__":
    main()
