r"""Dia 18 - Practica: busqueda avanzada (_include, chaining, modificadores).

Ejecuta:
    python dias\dia-18\practica\busqueda_avanzada.py
"""

import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
HEADERS = {"Accept": "application/fhir+json"}


def buscar(descripcion: str, recurso: str, params: dict) -> None:
    url = f"{BASE_URL}/{recurso}"
    try:
        resp = requests.get(url, params={**params, "_count": 5}, headers=HEADERS, timeout=60)
    except requests.RequestException as e:
        print(f"{descripcion}: ERROR {e}\n")
        return
    if not resp.ok:
        print(f"{descripcion}: HTTP {resp.status_code}\n")
        return
    bundle = resp.json()
    entries = bundle.get("entry", [])
    tipos = {}
    for e in entries:
        t = e.get("resource", {}).get("resourceType", "?")
        tipos[t] = tipos.get(t, 0) + 1
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    print(f"{descripcion}")
    print(f"  GET /{recurso}?{qs}&_count=5")
    print(f"  HTTP {resp.status_code}  entries={len(entries)}  tipos={tipos}")
    next_link = next((l.get("url") for l in bundle.get("link", []) if l.get("relation") == "next"), None)
    if next_link:
        print(f"  paginacion: hay link 'next'")
    print()


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")

    buscar(
        "Include: Observation + Patient referenciado",
        "Observation",
        {"_include": "Observation:subject", "_count": "3"},
    )

    buscar(
        "Chaining: Observation filtrada por apellido del Patient",
        "Observation",
        {"subject:Patient.name": "Smith", "_count": "3"},
    )

    buscar(
        "Modificador :missing — Patient sin birthDate",
        "Patient",
        {"birthdate:missing": "true", "_count": "3"},
    )

    # RETO: descomenta y prueba revinclude
    # buscar(
    #     "Revinclude: Patient + sus Observation",
    #     "Patient",
    #     {"_revinclude": "Observation:subject", "_count": "2"},
    # )

    print("Listo. Observa cuantos tipos de recurso trae el Bundle con _include.")


if __name__ == "__main__":
    main()
