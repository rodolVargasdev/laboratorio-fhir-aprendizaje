"""Dia 1 - Ejercicio 2: descargar un Patient real desde un servidor FHIR publico.

Usa el servidor de pruebas HAPI FHIR (R4). Necesita conexion a internet.
Es tu primer "GET" a una API REST de FHIR: pedimos un recurso y leemos su JSON.

Ejecuta:
    python 01-fundamentos-software\json\ejercicio_2_servidor.py
"""

import json

import requests

# Servidor FHIR publico de pruebas (R4). NO subir datos reales de pacientes.
BASE_URL = "https://hapi.fhir.org/baseR4"


def buscar_un_paciente() -> dict | None:
    """Pide al servidor hasta 1 paciente y devuelve el primero que encuentre.

    En FHIR, buscar recursos se hace con GET sobre /<TipoDeRecurso>.
    El parametro _count limita cuantos resultados pedimos.
    """
    url = f"{BASE_URL}/Patient"
    params = {"_count": 1}

    print(f"GET {url}?_count=1")
    respuesta = requests.get(
        url,
        params=params,
        headers={"Accept": "application/fhir+json"},
        timeout=30,
    )

    # El codigo de estado HTTP nos dice si salio bien (200) o hubo error.
    print(f"Codigo de estado HTTP: {respuesta.status_code}")
    respuesta.raise_for_status()

    bundle = respuesta.json()
    # Una busqueda FHIR devuelve un 'Bundle': una caja con resultados (entry).
    entradas = bundle.get("entry", [])
    if not entradas:
        return None
    return entradas[0]["resource"]


def mostrar_paciente(paciente: dict) -> None:
    print("\n=== JSON crudo del Patient (recortado) ===")
    texto = json.dumps(paciente, indent=2, ensure_ascii=False)
    # Mostramos solo las primeras lineas para no inundar la consola.
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
        print("Revisa tu conexion a internet e intenta de nuevo.")
        return

    if paciente is None:
        print("El servidor no devolvio pacientes en esta consulta.")
        return

    mostrar_paciente(paciente)
    print("\nListo. Acabas de hacer tu primer GET a una API FHIR.")


if __name__ == "__main__":
    main()
