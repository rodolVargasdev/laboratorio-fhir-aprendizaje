r"""Dia 17 - Practica: explorar seguridad OAuth/SMART y armar un JWT Backend Services.

No requiere registrar una app real. Construye un JWT de ejemplo y lee metadata.
Ejecuta:
    python dias\dia-17\practica\smart_explorar.py
"""

import base64
import json
import os
import time
import uuid

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
SMART_WELL_KNOWN = "https://bulk-data.smarthealthit.org/.well-known/smart-configuration"


def b64url(datos: dict) -> str:
    crudo = json.dumps(datos, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(crudo).rstrip(b"=").decode("ascii")


def leer_capability() -> None:
    print("=== CapabilityStatement / metadata ===")
    resp = requests.get(f"{BASE_URL}/metadata", headers={"Accept": "application/fhir+json"}, timeout=60)
    resp.raise_for_status()
    cap = resp.json()
    rest = cap.get("rest", [{}])[0]
    security = rest.get("security", {})
    print(f"  descripcion seguridad: {security.get('description', '(no especificada)')[:120]}")
    exts = security.get("extension", [])
    oauth_urls = []
    for ext in exts:
        url = ext.get("url", "")
        if "oauth" in url.lower() or "smart" in url.lower():
            oauth_urls.append(url)
            for sub in ext.get("extension", []):
                print(f"  - {sub.get('url', url)}: {sub.get('valueUri', sub.get('valueCode', ''))}")
    if not oauth_urls:
        print("  (Este servidor publico puede no exponer OAuth completo; es normal en sandboxes abiertos.)")


def jwt_backend_services_ejemplo() -> None:
    print("\n=== JWT de ejemplo (SMART Backend Services) ===")
    ahora = int(time.time())
    header = {"alg": "RS384", "typ": "JWT", "kid": "ejemplo-key-1"}
    payload = {
        "iss": "https://backend.doctorsv.ejemplo.sv",
        "sub": "https://backend.doctorsv.ejemplo.sv",
        "aud": "https://authorization.ejemplo.sv/oauth/token",
        "exp": ahora + 300,
        "jti": str(uuid.uuid4()),
    }
    jwt = f"{b64url(header)}.{b64url(payload)}.FIRMA_RSA_NO_REAL"
    print("Header:")
    print(json.dumps(header, indent=2))
    print("Payload (claims):")
    print(json.dumps(payload, indent=2))
    print("\nJWT (sin firma real, solo demostracion):")
    print(jwt[:80] + "...")
    print("\nClaims clave:")
    print("  iss/sub = identificador de tu cliente backend")
    print("  aud     = URL del endpoint de token OAuth")
    print("  exp     = expiracion corta (minutos)")
    print("  jti     = id unico del JWT (evita replay)")


def well_known_smart() -> None:
    print("\n=== SMART configuration (sandbox publico) ===")
    print(f"GET {SMART_WELL_KNOWN}")
    try:
        resp = requests.get(SMART_WELL_KNOWN, timeout=30)
        if resp.ok:
            cfg = resp.json()
            for clave in ("authorization_endpoint", "token_endpoint", "capabilities"):
                if clave in cfg:
                    print(f"  {clave}: {cfg[clave]}")
        else:
            print(f"  HTTP {resp.status_code} (puede variar segun el sandbox)")
    except requests.RequestException as e:
        print(f"  No disponible: {e}")


def main() -> None:
    print(f"Servidor FHIR: {BASE_URL}\n")
    leer_capability()
    jwt_backend_services_ejemplo()
    well_known_smart()
    print("\nReto: define scopes minimos para signos vitales en PROGRESO.md")


if __name__ == "__main__":
    main()
