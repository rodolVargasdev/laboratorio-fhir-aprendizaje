r"""Dia 6 - Practica: entender la estructura de un JWT decodificandolo.

Construimos un JWT de EJEMPLO (no real, sin firma valida) a partir de un header y
un payload, y luego lo decodificamos para VER que hay dentro. Asi entiendes que
header y payload son JSON en base64url (legibles) y que la firma va aparte.

Ejecuta:
    python dias\dia-06\practica\decodificar_jwt.py
"""

import base64
import json


def b64url(datos: dict) -> str:
    crudo = json.dumps(datos, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(crudo).rstrip(b"=").decode("ascii")


def decodificar_parte(parte: str) -> dict:
    relleno = "=" * (-len(parte) % 4)
    return json.loads(base64.urlsafe_b64decode(parte + relleno))


def main() -> None:
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {
        "iss": "https://auth.ejemplo.sv",
        "aud": "https://fhir.ejemplo.sv",
        "exp": 1900000000,
        "scope": "patient/Patient.read patient/Observation.read",
    }

    # Un JWT es: base64url(header).base64url(payload).firma
    jwt = f"{b64url(header)}.{b64url(payload)}.firma-de-ejemplo-no-valida"
    print("JWT de ejemplo (header.payload.signature):")
    print(jwt)

    partes = jwt.split(".")
    print("\n=== HEADER (como se firmo) ===")
    print(json.dumps(decodificar_parte(partes[0]), indent=2, ensure_ascii=False))

    payload_decodificado = decodificar_parte(partes[1])
    print("\n=== PAYLOAD (los 'claims') ===")
    print(json.dumps(payload_decodificado, indent=2, ensure_ascii=False))

    print("\nClaims clave:")
    print(f"  iss (emisor)    : {payload_decodificado.get('iss')}")
    print(f"  aud (audiencia) : {payload_decodificado.get('aud')}")
    print(f"  exp (expira)    : {payload_decodificado.get('exp')}")
    print(f"  scope (permisos): {payload_decodificado.get('scope')}")
    print("\nNota: la firma (3a parte) garantiza que el token no fue alterado.")


if __name__ == "__main__":
    main()
