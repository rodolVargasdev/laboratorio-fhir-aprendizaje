r"""Dia 4 - Practica: busquedas FHIR con parametros y lectura de codigos de estado.

Ejecuta:
    python dias\dia-04\practica\buscar.py
"""

import requests

BASE_URL = "https://hapi.fhir.org/baseR4"
HEADERS = {"Accept": "application/fhir+json"}


def buscar(descripcion: str, recurso: str, params: dict) -> None:
    url = f"{BASE_URL}/{recurso}"
    resp = requests.get(url, params={**params, "_count": 3}, headers=HEADERS, timeout=30)
    total = resp.json().get("total", "?") if resp.ok else "-"
    consulta = "&".join(f"{k}={v}" for k, v in params.items())
    print(f"{descripcion}")
    print(f"  GET /{recurso}?{consulta}")
    print(f"  HTTP {resp.status_code}  total~{total}\n")


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")
    buscar("Pacientes con apellido 'Smith'", "Patient", {"family": "Smith"})
    buscar("Pacientes de genero femenino", "Patient", {"gender": "female"})
    buscar("Observaciones de frecuencia cardiaca (LOINC 8867-4)", "Observation", {"code": "8867-4"})
    # RETO: agrega aqui una busqueda de Patient con gender=male
    print("Recuerda: 4xx = error tuyo (cliente); 5xx = error del servidor.")


if __name__ == "__main__":
    main()
