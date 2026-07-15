r"""Dia 2 - Practica: navegar una Observation anidada desde el servidor publico.

Ejecuta:
    python dias\dia-02\practica\navegar_observation.py
"""

import requests

BASE_URL = "https://hapi.fhir.org/baseR4"


def primera_observation() -> dict | None:
    resp = requests.get(
        f"{BASE_URL}/Observation",
        params={"_count": 1},
        headers={"Accept": "application/fhir+json"},
        timeout=30,
    )
    resp.raise_for_status()
    entradas = resp.json().get("entry", [])
    return entradas[0]["resource"] if entradas else None


def valor_legible(obs: dict) -> str:
    """Una Observation puede guardar el valor de varias formas. Cubrimos las comunes."""
    if "valueQuantity" in obs:
        q = obs["valueQuantity"]
        return f"{q.get('value')} {q.get('unit', '')}".strip()
    if "valueCodeableConcept" in obs:
        cc = obs["valueCodeableConcept"]
        return cc.get("text") or "(concepto codificado)"
    if "valueString" in obs:
        return obs["valueString"]
    return "(sin valor simple)"


def main() -> None:
    obs = primera_observation()
    if obs is None:
        print("No se encontraron observaciones.")
        return

    print("=== Navegando una Observation ===")
    print(f"status                         : {obs.get('status')}")

    coding = obs.get("code", {}).get("coding", [{}])
    primer_coding = coding[0] if coding else {}
    print(f"code.coding[0].system          : {primer_coding.get('system')}")
    print(f"code.coding[0].code            : {primer_coding.get('code')}")
    print(f"code.coding[0].display         : {primer_coding.get('display')}")
    print(f"code.text                      : {obs.get('code', {}).get('text')}")
    print(f"subject.reference              : {obs.get('subject', {}).get('reference')}")
    print(f"valor medido (legible)         : {valor_legible(obs)}")

    # RETO: imprime tambien obs.get('status') ya esta; agrega 'effectiveDateTime'
    # print(f"effectiveDateTime              : {obs.get('effectiveDateTime')}")


if __name__ == "__main__":
    main()
