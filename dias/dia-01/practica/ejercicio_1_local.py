r"""Dia 1 - Ejercicio 1: leer un recurso FHIR Patient desde un archivo JSON local.

No necesita internet. Practica las "rutas" para extraer datos de un JSON.

Ejecuta:
    python dias\dia-01\practica\ejercicio_1_local.py
"""

import json
from pathlib import Path


def cargar_paciente() -> dict:
    ruta = Path(__file__).parent / "paciente_ejemplo.json"
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    paciente = cargar_paciente()

    print("=== Lectura de un Patient desde JSON local ===\n")
    print(f"Tipo de recurso : {paciente['resourceType']}")   # Patient.resourceType
    print(f"Id              : {paciente['id']}")              # Patient.id

    apellido = paciente["name"][0]["family"]                  # Patient.name[0].family
    print(f"Apellido        : {apellido}")

    primer_nombre = paciente["name"][0]["given"][0]           # Patient.name[0].given[0]
    print(f"Primer nombre   : {primer_nombre}")

    print("\nDatos de contacto (telecom):")
    for contacto in paciente.get("telecom", []):
        print(f"  - {contacto['system']}: {contacto['value']} ({contacto['use']})")

    print(f"Fecha de nacimiento: {paciente["birthDate"]}")
    print(f"Genero: {paciente["gender"]}")

    # ----------------------------------------------------------------------
    # RETO: imprisme la fecha de nacimiento (birthDate) y el genero (gender).
    # Pista: son campos directos del paciente, como 'id'.

    # print(f"Fecha nacimiento: {paciente[...]}")
    # print(f"Genero          : {paciente[...]}")
    # ----------------------------------------------------------------------


if __name__ == "__main__":
    main()
