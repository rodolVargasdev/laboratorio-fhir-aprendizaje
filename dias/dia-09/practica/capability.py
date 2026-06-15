r"""Dia 9 - Practica: leer el CapabilityStatement de un servidor FHIR.

Funciona con cualquier servidor segun la variable de entorno FHIR_BASE_URL:
- Publico de pruebas (por defecto): https://hapi.fhir.org/baseR4
- Local HAPI:  $env:FHIR_BASE_URL = "http://localhost:8080/fhir"
- GCP: define FHIR_BASE_URL y TOKEN (ver crear-store.md)

Ejecuta:
    python dias\dia-09\practica\capability.py
"""

import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
TOKEN = os.environ.get("TOKEN")  # solo necesario para GCP


def main() -> None:
    headers = {"Accept": "application/fhir+json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    url = f"{BASE_URL}/metadata"
    print(f"GET {url}")
    resp = requests.get(url, headers=headers, timeout=60)
    print(f"HTTP {resp.status_code}")
    if not resp.ok:
        print(resp.text[:500])
        return

    cap = resp.json()
    print(f"\nresourceType : {cap.get('resourceType')}")
    print(f"fhirVersion  : {cap.get('fhirVersion')}")
    print(f"software     : {cap.get('software', {}).get('name')}")

    # Contar cuantos tipos de recurso soporta el servidor
    rest = cap.get("rest", [{}])
    recursos = rest[0].get("resource", []) if rest else []
    print(f"tipos de recurso soportados: {len(recursos)}")
    nombres = [r.get("type") for r in recursos[:10]]
    print(f"ejemplos: {', '.join(n for n in nombres if n)}")


if __name__ == "__main__":
    main()
