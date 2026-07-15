r"""Dia 19 - Practica: operaciones de terminologia ($expand, $lookup).

Usa el servidor publico tx.fhir.org (gratis).
Ejecuta:
    python dias\dia-19\practica\terminologia_avanzada.py
"""

import requests

TX = "https://tx.fhir.org/r4"
HEADERS = {"Accept": "application/fhir+json"}


def expand_valueset() -> None:
    url = f"{TX}/ValueSet/$expand"
    params = {"url": "http://hl7.org/fhir/ValueSet/administrative-gender"}
    print("=== $expand: generos administrativos FHIR ===")
    print(f"GET {url}?url=...administrative-gender")
    resp = requests.get(url, params=params, headers=HEADERS, timeout=60)
    print(f"HTTP {resp.status_code}")
    if not resp.ok:
        print(resp.text[:300])
        return
    vs = resp.json()
    contains = vs.get("expansion", {}).get("contains", [])
    print(f"Codigos expandidos: {len(contains)}")
    for c in contains[:6]:
        print(f"  - {c.get('code')} : {c.get('display')}")


def lookup_loinc() -> None:
    print("\n=== $lookup: codigo LOINC frecuencia cardiaca ===")
    url = f"{TX}/CodeSystem/$lookup"
    params = {"system": "http://loinc.org", "code": "8867-4"}
    resp = requests.get(url, params=params, headers=HEADERS, timeout=60)
    print(f"HTTP {resp.status_code}")
    if resp.ok:
        params_out = resp.json().get("parameter", [])
        for p in params_out:
            if p.get("name") == "display":
                print(f"  display: {p.get('valueString', p.get('valueCode'))}")
    else:
        print(resp.text[:200])


def validate_code() -> None:
    print("\n=== $validate-code (RETO: interpretar resultado) ===")
    url = f"{TX}/CodeSystem/$validate-code"
    params = {
        "url": "http://hl7.org/fhir/ValueSet/administrative-gender",
        "code": "male",
        "system": "http://hl7.org/fhir/administrative-gender",
    }
    resp = requests.get(url, params=params, headers=HEADERS, timeout=60)
    print(f"HTTP {resp.status_code}")
    if resp.ok:
        for p in resp.json().get("parameter", []):
            if p.get("name") == "result":
                print(f"  result (valido?): {p.get('valueBoolean')}")


def main() -> None:
    try:
        expand_valueset()
        lookup_loinc()
        validate_code()
    except requests.RequestException as e:
        print(f"Error de red: {e}")
        return
    print("\nListo. Terminologia = vocabularios compartidos para interoperar.")


if __name__ == "__main__":
    main()
