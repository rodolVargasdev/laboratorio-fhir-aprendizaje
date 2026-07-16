r"""Dia 16 - Practica: explorar un StructureDefinition y validar contra un profile.

Usa US Core Patient como ejemplo canonico. Servidor publico HAPI por defecto.
USA SOLO DATOS FICTICIOS.

Ejecuta:
    python dias\dia-16\practica\explorar_profile.py
"""

import json
import os

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
TOKEN = os.environ.get("TOKEN")
HEADERS = {"Accept": "application/fhir+json", "Content-Type": "application/fhir+json"}
if TOKEN:
    HEADERS["Authorization"] = f"Bearer {TOKEN}"

US_CORE_PATIENT = "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"


def get_profile(url: str) -> dict | None:
    """Busca StructureDefinition por canonical URL (search en el servidor)."""
    resp = requests.get(
        f"{BASE_URL}/StructureDefinition",
        params={"url": url},
        headers=HEADERS,
        timeout=60,
    )
    if not resp.ok:
        print(f"No se pudo buscar el profile: HTTP {resp.status_code}")
        return None
    bundle = resp.json()
    entries = bundle.get("entry", [])
    if not entries:
        print("Profile no encontrado en este servidor. Se usara solo validacion.")
        return None
    return entries[0]["resource"]


def mostrar_profile(sd: dict) -> None:
    print("\n=== StructureDefinition (US Core Patient) ===")
    print(f"  url             : {sd.get('url')}")
    print(f"  name            : {sd.get('name')}")
    print(f"  type            : {sd.get('type')}")
    print(f"  baseDefinition  : {sd.get('baseDefinition')}")
    print(f"  status          : {sd.get('status')}")
    diff = sd.get("differential", {}).get("element", [])
    print(f"  differential    : {len(diff)} elementos modificados (muestra 3):")
    for elem in diff[:3]:
        path = elem.get("path", "")
        min_val = elem.get("min", "-")
        must = " [mustSupport]" if elem.get("mustSupport") else ""
        print(f"    - {path} min={min_val}{must}")


def validar_con_profile(paciente: dict, etiqueta: str) -> None:
    params = {"profile": US_CORE_PATIENT}
    print(f"\n--- Validacion: {etiqueta} ---")
    print(f"POST Patient/$validate?profile=us-core-patient")
    resp = requests.post(
        f"{BASE_URL}/Patient/$validate",
        params=params,
        json=paciente,
        headers=HEADERS,
        timeout=60,
    )
    print(f"HTTP {resp.status_code}")
    resultado = resp.json()
    if resultado.get("resourceType") != "OperationOutcome":
        print(json.dumps(resultado, indent=2, ensure_ascii=False)[:500])
        return
    issues = resultado.get("issue", [])
    errores = [i for i in issues if i.get("severity") in ("error", "fatal")]
    warnings = [i for i in issues if i.get("severity") == "warning"]
    print(f"  errors/fatal: {len(errores)}  warnings: {len(warnings)}")
    for issue in (errores + warnings)[:5]:
        print(f"  - [{issue.get('severity')}] {issue.get('diagnostics', '')[:120]}")


def main() -> None:
    print(f"Servidor: {BASE_URL}")
    print(f"Profile objetivo: {US_CORE_PATIENT}\n")

    sd = get_profile(US_CORE_PATIENT)
    if sd:
        mostrar_profile(sd)

    # Patient minimo R4 (puede fallar US Core por campos obligatorios del profile).
    paciente_minimo = {
        "resourceType": "Patient",
        "name": [{"family": "Profile", "given": ["Dia16"]}],
    }
    validar_con_profile(paciente_minimo, "Patient minimo (RETO: enriquecer hasta pasar)")

    # Patient mas completo (mejor chance contra US Core).
    paciente_mejor = {
        "resourceType": "Patient",
        "meta": {"profile": [US_CORE_PATIENT]},
        "identifier": [{"system": "http://integracion-nacional.ejemplo.sv/mrn", "value": "MRN-001"}],
        "name": [{"family": "Profile", "given": ["Dia16"], "use": "official"}],
        "gender": "unknown",
        "birthDate": "1990-01-01",
    }
    validar_con_profile(paciente_mejor, "Patient enriquecido con meta.profile")

    print("\nListo. Un profile RESTRINGE el estandar base para un caso de uso.")


if __name__ == "__main__":
    main()
