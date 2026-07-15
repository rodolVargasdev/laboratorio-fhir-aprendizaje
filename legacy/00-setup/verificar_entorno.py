"""Comprueba que el entorno del laboratorio esta listo.

Ejecuta:  python 00-setup\verificar_entorno.py
"""

import sys


def main() -> int:
    print("Verificando entorno del laboratorio FHIR...\n")

    # 1) Version de Python
    version = sys.version_info
    print(f"Python detectado: {version.major}.{version.minor}.{version.micro}")
    if version < (3, 9):
        print("  AVISO: se recomienda Python 3.9 o superior.")
    else:
        print("  OK: version de Python adecuada.")

    # 2) Librerias necesarias para la semana 1
    faltantes = []
    for libreria in ("requests", "rich"):
        try:
            __import__(libreria)
            print(f"  OK: libreria '{libreria}' instalada.")
        except ImportError:
            faltantes.append(libreria)
            print(f"  FALTA: libreria '{libreria}' no encontrada.")

    print()
    if faltantes:
        print("Entorno incompleto. Instala las dependencias con:")
        print("  pip install -r requirements.txt")
        return 1

    print("Entorno listo. Ya puedes empezar el Dia 1.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
