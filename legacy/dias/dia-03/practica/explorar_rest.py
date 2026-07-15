r"""Dia 3 - Practica: explorar lecturas REST de varios tipos de recurso FHIR.

Ejecuta:
    python dias\dia-03\practica\explorar_rest.py
"""

import requests

BASE_URL = "https://hapi.fhir.org/baseR4"
HEADERS = {"Accept": "application/fhir+json"}

# Reto: agrega "Practitioner" a esta lista y vuelve a correr.
TIPOS = ["Patient", "Observation", "Organization"]


def contar(tipo: str) -> None:
    url = f"{BASE_URL}/{tipo}"
    try:
        resp = requests.get(url, params={"_count": 5}, headers=HEADERS, timeout=30)
    except requests.RequestException as e:
        print(f"{tipo:14s} ERROR de conexion: {e}")
        return
    bundle = resp.json() if resp.ok else {}
    total = bundle.get("total", "?")
    recibidos = len(bundle.get("entry", []))
    print(f"{tipo:14s} HTTP {resp.status_code}  total~{total}  recibidos={recibidos}")


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")
    print("Haciendo GET (search) de varios tipos de recurso:\n")
    for tipo in TIPOS:
        contar(tipo)
    print("\nNota: 'search' (GET [base]/Tipo) devuelve un Bundle con 'entry'.")


if __name__ == "__main__":
    main()
