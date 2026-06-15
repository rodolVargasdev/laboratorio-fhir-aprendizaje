r"""Dia 13 - Mini-proyecto: crear datos de un paciente y generar un resumen clinico.

Integra JSON, REST/CRUD, referencias, terminologias y el modelo FHIR.
Funciona con el servidor de FHIR_BASE_URL (publico por defecto, local o GCP).
USA SOLO DATOS FICTICIOS.

Ejecuta:
    python dias\dia-13\practica\resumen_clinico.py
"""

import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
TOKEN = os.environ.get("TOKEN")
HEADERS = {"Accept": "application/fhir+json", "Content-Type": "application/fhir+json"}
if TOKEN:
    HEADERS["Authorization"] = f"Bearer {TOKEN}"


def post(recurso: dict) -> dict:
    r = requests.post(f"{BASE_URL}/{recurso['resourceType']}", json=recurso, headers=HEADERS, timeout=60)
    r.raise_for_status()
    return r.json()


def sembrar_datos() -> str:
    paciente = post({
        "resourceType": "Patient",
        "name": [{"family": "Ramos", "given": ["Sofia"]}],
        "gender": "female",
        "birthDate": "1988-03-15",
    })
    pid = paciente["id"]

    observaciones = [
        ("8480-6", "Presion sistolica", 138, "mmHg"),
        ("8462-4", "Presion diastolica", 89, "mmHg"),
        ("8867-4", "Frecuencia cardiaca", 76, "/min"),
    ]
    for code, display, valor, unidad in observaciones:
        post({
            "resourceType": "Observation",
            "status": "final",
            "code": {"coding": [{"system": "http://loinc.org", "code": code, "display": display}]},
            "subject": {"reference": f"Patient/{pid}"},
            "valueQuantity": {"value": valor, "unit": unidad},
        })

    post({
        "resourceType": "Condition",
        "code": {"coding": [{"system": "http://snomed.info/sct", "code": "38341003", "display": "Hipertension"}]},
        "subject": {"reference": f"Patient/{pid}"},
    })
    return pid


def resumen(pid: str) -> None:
    paciente = requests.get(f"{BASE_URL}/Patient/{pid}", headers=HEADERS, timeout=60).json()
    obs = requests.get(f"{BASE_URL}/Observation", params={"subject": f"Patient/{pid}", "_count": 50},
                       headers=HEADERS, timeout=60).json()
    cond = requests.get(f"{BASE_URL}/Condition", params={"subject": f"Patient/{pid}", "_count": 50},
                        headers=HEADERS, timeout=60).json()

    nombre = paciente.get("name", [{}])[0]
    nombre_txt = " ".join(nombre.get("given", []) + [nombre.get("family", "")]).strip()

    print("\n" + "=" * 60)
    print("RESUMEN CLINICO (datos ficticios)")
    print("=" * 60)
    print(f"Paciente : {nombre_txt}")
    print(f"Sexo     : {paciente.get('gender')}")
    print(f"Nacio    : {paciente.get('birthDate')}")
    # RETO: calcula y muestra la edad a partir de birthDate.

    print("\nDiagnosticos:")
    for e in cond.get("entry", []):
        c = e["resource"].get("code", {}).get("coding", [{}])[0]
        print(f"  - {c.get('display')} (SNOMED {c.get('code')})")

    print("\nObservaciones:")
    for e in obs.get("entry", []):
        r = e["resource"]
        code = r.get("code", {}).get("coding", [{}])[0]
        v = r.get("valueQuantity", {})
        print(f"  - {code.get('display')}: {v.get('value')} {v.get('unit', '')}")


def main() -> None:
    print(f"Servidor: {BASE_URL}")
    try:
        pid = sembrar_datos()
        resumen(pid)
    except requests.HTTPError as e:
        print(f"Error HTTP: {e}")
        return
    print("\nProyecto completado: creaste datos y generaste un resumen leyendolos del servidor.")


if __name__ == "__main__":
    main()
