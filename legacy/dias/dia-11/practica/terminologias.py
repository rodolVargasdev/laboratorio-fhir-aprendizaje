r"""Dia 11 - Practica: detectar que sistemas de terminologia aparecen en datos reales.

Ejecuta:
    python dias\dia-11\practica\terminologias.py
"""

import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
HEADERS = {"Accept": "application/fhir+json"}

# Diccionario de URLs de 'system' conocidas a nombre legible.
# RETO: agrega RxNorm: "http://www.nlm.nih.gov/research/umls/rxnorm": "RxNorm (medicamentos)"
SISTEMAS = {
    "http://loinc.org": "LOINC (mediciones/laboratorio)",
    "http://snomed.info/sct": "SNOMED CT (conceptos clinicos)",
    "http://unitsofmeasure.org": "UCUM (unidades de medida)",
    "http://hl7.org/fhir/sid/icd-10": "ICD-10 (diagnosticos)",
}


def nombre_sistema(url: str) -> str:
    return SISTEMAS.get(url, f"(desconocido: {url})")


def main() -> None:
    print(f"Servidor: {BASE_URL}\n")
    r = requests.get(f"{BASE_URL}/Observation", params={"_count": 10}, headers=HEADERS, timeout=60)
    r.raise_for_status()
    entradas = r.json().get("entry", [])

    vistos: dict[str, int] = {}
    for entrada in entradas:
        obs = entrada["resource"]
        for coding in obs.get("code", {}).get("coding", []):
            system = coding.get("system", "(sin system)")
            vistos[system] = vistos.get(system, 0) + 1
            print(f"code: {coding.get('code'):>10}  {nombre_sistema(system)}  ({coding.get('display', '')})")

    print("\nResumen de sistemas encontrados:")
    for system, n in sorted(vistos.items(), key=lambda x: -x[1]):
        print(f"  {n:>3}x  {nombre_sistema(system)}")


if __name__ == "__main__":
    main()
