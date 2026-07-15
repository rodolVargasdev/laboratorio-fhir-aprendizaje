r"""Dia 12 - Practica: recorrer un Bundle y ver como se enlazan los recursos.

No necesita internet. Usa el ejemplo_bundle.json incluido.

Ejecuta:
    python dias\dia-12\practica\recorrer_bundle.py
"""

import json
from pathlib import Path


def cargar_bundle() -> dict:
    ruta = Path(__file__).parent / "ejemplo_bundle.json"
    with ruta.open(encoding="utf-8") as f:
        return json.load(f)


def etiqueta(recurso: dict) -> str:
    tipo = recurso.get("resourceType")
    rid = recurso.get("id")
    nombres = recurso.get("name", [])
    if nombres:
        n = nombres[0]
        texto = " ".join(n.get("given", []) + [n.get("family", "")]).strip()
        return f"{tipo}/{rid} ({texto})"
    if "code" in recurso:
        coding = recurso["code"].get("coding", [{}])
        return f"{tipo}/{rid} ({coding[0].get('display', '')})"
    return f"{tipo}/{rid}"


def main() -> None:
    bundle = cargar_bundle()
    print(f"Bundle tipo: {bundle.get('type')}  con {len(bundle.get('entry', []))} recursos\n")

    print("Recursos:")
    for entrada in bundle["entry"]:
        print(f"  - {etiqueta(entrada['resource'])}")

    print("\nReferencias (como se conectan):")
    for entrada in bundle["entry"]:
        r = entrada["resource"]
        for campo in ("subject", "encounter"):
            if campo in r:
                print(f"  {r['resourceType']}/{r.get('id')} --{campo}--> {r[campo]['reference']}")

    print("\nObserva: todo apunta a Patient/p1 (la atencion gira en torno al paciente).")


if __name__ == "__main__":
    main()
