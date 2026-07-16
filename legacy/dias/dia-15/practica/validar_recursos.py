r"""Dia 15 - Practica: $validate y lectura de OperationOutcome.

Valida un Patient valido y uno invalido contra el servidor publico HAPI.
USA SOLO DATOS FICTICIOS.

Ejecuta:
    python dias\dia-15\practica\validar_recursos.py
"""

import json
import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
TOKEN = os.environ.get("TOKEN")
HEADERS = {"Accept": "application/fhir+json", "Content-Type": "application/fhir+json"}
if TOKEN:
    HEADERS["Authorization"] = f"Bearer {TOKEN}"


def validar(recurso: dict, etiqueta: str) -> None:
    tipo = recurso["resourceType"]
    url = f"{BASE_URL}/{tipo}/$validate"
    print(f"\n--- {etiqueta} ---")
    print(f"POST {url}")
    try:
        resp = requests.post(url, json=recurso, headers=HEADERS, timeout=60)
    except requests.RequestException as e:
        print(f"Error de conexion: {e}")
        return

    print(f"HTTP {resp.status_code}")
    try:
        resultado = resp.json()
    except json.JSONDecodeError:
        print(resp.text[:400])
        return

    if resultado.get("resourceType") != "OperationOutcome":
        print("Respuesta inesperada (no es OperationOutcome):")
        print(json.dumps(resultado, indent=2, ensure_ascii=False)[:600])
        return

    issues = resultado.get("issue", [])
    if not issues:
        print("Sin issues reportados (instancia valida segun el servidor).")
        return

    print(f"Issues encontrados: {len(issues)}")
    for i, issue in enumerate(issues, 1):
        print(f"  [{i}] severity={issue.get('severity')} code={issue.get('code')}")
        print(f"      location : {issue.get('location', issue.get('expression', []))}")
        print(f"      diagnostics: {issue.get('diagnostics', '(sin mensaje)')}")


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")

    paciente_valido = {
        "resourceType": "Patient",
        "name": [{"family": "Validacion", "given": ["Dia15"]}],
        "gender": "unknown",
    }
    validar(paciente_valido, "Patient VALIDO (tiene name)")

    paciente_invalido = {
        "resourceType": "Patient",
        "gender": "unknown",
        # Falta 'name' (minimo 1 en muchos contextos; el validador lo detecta).
    }
    validar(paciente_invalido, "Patient INVALIDO (sin name)")

    # RETO: valida una Observation sin 'status' y corrige hasta que no haya errors.
    obs_invalida = {
        "resourceType": "Observation",
        "code": {"text": "Prueba"},
        "subject": {"reference": "Patient/ejemplo"},
    }
    validar(obs_invalida, "Observation INVALIDA (sin status) - RETO: corrige y revalida")

    print("\nListo. Aprendiste a leer OperationOutcome como mapa de correcciones.")


if __name__ == "__main__":
    main()
