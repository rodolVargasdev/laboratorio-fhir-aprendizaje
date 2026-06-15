r"""Dia 1 - Ejercicio 2: descargar un Patient real desde un servidor FHIR publico.

Usa el servidor de pruebas HAPI FHIR (R4). Necesita conexion a internet.
Es tu primer "GET" a una API REST de FHIR.

Ejecuta:
    python dias\dia-01\practica\ejercicio_2_servidor.py
"""

import json

import requests

BASE_URL = "https://hapi.fhir.org/baseR4"


def buscar_un_paciente() -> dict | None:
    url = f"{BASE_URL}/Patient"
    print(f"GET {url}?_count=1")
    respuesta = requests.get(
        url,
        params={"_count": 1},
        headers={"Accept": "application/fhir+json"},
        timeout=30,
    )
    print(f"Codigo de estado HTTP: {respuesta.status_code}")
    respuesta.raise_for_status()
    bundle = respuesta.json()
    entradas = bundle.get("entry", [])
    return entradas[0]["resource"] if entradas else None


def mostrar_paciente(paciente: dict) -> None:
    print("\n=== JSON crudo del Patient (recortado) ===")
    texto = json.dumps(paciente, indent=2, ensure_ascii=False)
    print("\n".join(texto.splitlines()[:25]))
    print("...")

    print("\n=== Datos extraidos con rutas FHIR ===")
    print(f"resourceType : {paciente.get('resourceType')}")
    print(f"id           : {paciente.get('id')}")
    nombres = paciente.get("name", [])
    if nombres:
        familia = nombres[0].get("family", "(sin apellido)")
        dados = nombres[0].get("given", [])
        print(f"name[0].family : {familia}")
        print(f"name[0].given  : {', '.join(dados) if dados else '(sin nombre)'}")
    else:
        print("Este paciente no tiene el campo 'name'.")


def main() -> None:
    print("=== Conectando al servidor FHIR publico HAPI ===\n")
    try:
        paciente = buscar_un_paciente()
    except requests.RequestException as error:
        print(f"No se pudo conectar al servidor: {error}")
        return
    if paciente is None:
        print("El servidor no devolvio pacientes.")
        return
    mostrar_paciente(paciente)
    print("\nListo. Acabas de hacer tu primer GET a una API FHIR.")


if __name__ == "__main__":
    main()
