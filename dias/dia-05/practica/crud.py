r"""Dia 5 - Practica: ciclo CRUD completo contra el servidor publico HAPI.

Crea un paciente FICTICIO, lo lee, lo actualiza y lo borra.
USA SOLO DATOS FICTICIOS. Nunca datos reales de pacientes.

Ejecuta:
    python dias\dia-05\practica\crud.py
"""

import requests

BASE_URL = "https://hapi.fhir.org/baseR4"
HEADERS = {
    "Accept": "application/fhir+json",
    "Content-Type": "application/fhir+json",
}


def main() -> None:
    paciente = {
        "resourceType": "Patient",
        "active": True,
        "name": [{"use": "official", "family": "Prueba", "given": ["Paciente", "Ficticio"]}],
        "gender": "other",
        "birthDate": "2000-01-01",
    }

    # CREATE (POST)
    print("1) CREATE con POST...")
    r = requests.post(f"{BASE_URL}/Patient", json=paciente, headers=HEADERS, timeout=30)
    print(f"   HTTP {r.status_code} (esperado 201 Created)")
    creado = r.json()
    nuevo_id = creado.get("id")
    print(f"   id asignado por el servidor: {nuevo_id}")

    # READ (GET)
    print("\n2) READ con GET...")
    r = requests.get(f"{BASE_URL}/Patient/{nuevo_id}", headers=HEADERS, timeout=30)
    print(f"   HTTP {r.status_code} (esperado 200 OK)")
    print(f"   apellido leido: {r.json().get('name', [{}])[0].get('family')}")

    # UPDATE (PUT) - cambiamos el apellido; PUT necesita el recurso completo con id
    print("\n3) UPDATE con PUT...")
    actualizado = r.json()
    actualizado["name"][0]["family"] = "PruebaActualizada"
    r = requests.put(f"{BASE_URL}/Patient/{nuevo_id}", json=actualizado, headers=HEADERS, timeout=30)
    print(f"   HTTP {r.status_code} (esperado 200 OK)")

    # DELETE
    print("\n4) DELETE...")
    r = requests.delete(f"{BASE_URL}/Patient/{nuevo_id}", headers=HEADERS, timeout=30)
    print(f"   HTTP {r.status_code} (esperado 200 o 204)")

    # RETO: agrega aqui un GET del mismo id y observa el codigo (suele ser 404 o 410).
    print("\nListo. Completaste un ciclo CRUD.")


if __name__ == "__main__":
    main()
