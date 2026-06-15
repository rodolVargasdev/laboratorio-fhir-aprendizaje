r"""Dia 8 - Practica: comprobar si gcloud esta instalado y configurado (Via A).

No realiza ninguna operacion que cueste dinero: solo lee configuracion local.

Ejecuta:
    python dias\dia-08\practica\comprobar_gcloud.py
"""

import shutil
import subprocess


def main() -> None:
    ruta = shutil.which("gcloud")
    if not ruta:
        print("gcloud NO esta instalado o no esta en el PATH.")
        print("Si elegiste la Via A, sigue practica/gcp-cuenta.md (Paso 4).")
        print("Si elegiste la Via B (local), puedes ignorar esto.")
        return

    print(f"gcloud encontrado en: {ruta}\n")
    try:
        salida = subprocess.run(
            ["gcloud", "config", "list", "--format=value(core.project,core.account)"],
            capture_output=True, text=True, timeout=30,
        )
        print("Configuracion actual (proyecto / cuenta):")
        print(salida.stdout.strip() or "(sin proyecto/cuenta configurados)")
    except Exception as e:  # noqa: BLE001
        print(f"No se pudo leer la configuracion: {e}")


if __name__ == "__main__":
    main()
