r"""Dia 1 - Ejercicio 1: leer un recurso FHIR Patient desde un archivo JSON local.

No necesita internet. Practica las "rutas" para extraer datos de un JSON.

Ejecuta:
    python 01-fundamentos-software\json\ejercicio_1_local.py
"""

import json
from pathlib import Path


def cargar_paciente() -> dict:
    """Lee el archivo paciente_ejemplo.json que esta junto a este script."""
    ruta = Path(__file__).parent / "paciente_ejemplo.json"
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    paciente = cargar_paciente()

    # 'paciente' es un diccionario de Python (equivalente a un objeto JSON).
    # Accedemos a los datos con la misma logica de "rutas" que en FHIR.

    print("=== Lectura de un Patient desde JSON local ===\n")

    # Ruta FHIR: Patient.resourceType
    print(f"Tipo de recurso : {paciente['resourceType']}")

    # Ruta FHIR: Patient.id
    print(f"Id              : {paciente['id']}")

    # Ruta FHIR: Patient.name[0].family
    # name es un array -> tomamos el primer elemento con [0]
    apellido = paciente["name"][0]["family"]
    print(f"Apellido        : {apellido}")

    # Ruta FHIR: Patient.name[0].given[0]
    primer_nombre = paciente["name"][0]["given"][0]
    print(f"Primer nombre   : {primer_nombre}")

    # Recorrer un array: imprimir todos los telefonos/correos (telecom)
    print("\nDatos de contacto (telecom):")
    for contacto in paciente.get("telecom", []):
        print(f"  - {contacto['system']}: {contacto['value']} ({contacto['use']})")

    # ----------------------------------------------------------------------
    # RETO: imprime la fecha de nacimiento (birthDate) y el genero (gender).
    # Pista: son campos directos del paciente, como 'id'.
    # Escribe tu codigo debajo de esta linea:

    # print(f"Fecha nacimiento: {paciente[...]}")
    # print(f"Genero          : {paciente[...]}")
    # ----------------------------------------------------------------------


if __name__ == "__main__":
    main()
