r"""Dia 10 - Practica: crear un paciente y una observacion enlazada, y consultar.

Funciona con el servidor que indique FHIR_BASE_URL (publico por defecto, local o GCP).
USA SOLO DATOS FICTICIOS.

Ejecuta:
    python dias\dia-10\practica\cargar_y_consultar.py
"""

import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
TOKEN = os.environ.get("TOKEN")

HEADERS = {"Accept": "application/fhir+json", "Content-Type": "application/fhir+json"}
if TOKEN:
    HEADERS["Authorization"] = f"Bearer {TOKEN}"


def crear_paciente() -> str:
    paciente = {
        "resourceType": "Patient",
        "name": [{"family": "Demo", "given": ["Dia10"]}],
        "gender": "other",
        "birthDate": "1990-05-05",
    }
    r = requests.post(f"{BASE_URL}/Patient", json=paciente, headers=HEADERS, timeout=60)
    r.raise_for_status()
    pid = r.json()["id"]
    print(f"Paciente creado: Patient/{pid}")
    return pid


def crear_observacion(pid: str) -> None:
    obs = {
        "resourceType": "Observation",
        "status": "final",
        "code": {
            "coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Frecuencia cardiaca"}],
            "text": "Frecuencia cardiaca",
        },
        "subject": {"reference": f"Patient/{pid}"},
        "valueQuantity": {"value": 72, "unit": "latidos/min", "system": "http://unitsofmeasure.org", "code": "/min"},
    }
    r = requests.post(f"{BASE_URL}/Observation", json=obs, headers=HEADERS, timeout=60)
    r.raise_for_status()
    print(f"Observacion creada: Observation/{r.json()['id']} -> Patient/{pid}")


def consultar(pid: str) -> None:
    r = requests.get(f"{BASE_URL}/Observation", params={"subject": f"Patient/{pid}"}, headers=HEADERS, timeout=60)
    r.raise_for_status()
    bundle = r.json()
    print(f"\nObservaciones del paciente {pid}: total~{bundle.get('total', '?')}")
    for entrada in bundle.get("entry", []):
        rec = entrada["resource"]
        valor = rec.get("valueQuantity", {})
        print(f"  - {rec.get('code', {}).get('text')}: {valor.get('value')} {valor.get('unit', '')}")


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")
    try:
        pid = crear_paciente()
        crear_observacion(pid)
        consultar(pid)
    except requests.HTTPError as e:
        print(f"Error HTTP: {e}\n{e.response.text[:300] if e.response else ''}")
        return
    # RETO: crea una segunda observacion (temperatura, LOINC 8310-5) y vuelve a consultar.
    print("\nListo. Creaste y consultaste datos enlazados por referencia.")


if __name__ == "__main__":
    main()
