r"""Dia 20 - Practica: consultar metricas del FHIR store en GCP (si tienes gcloud).

Si no tienes GCP configurado, imprime instrucciones para seguir en local.
Ejecuta:
    python dias\dia-20\practica\gcp_metricas.py
"""

import json
import shutil
import subprocess


def gcloud_ok() -> bool:
    return shutil.which("gcloud") is not None


def config() -> tuple[str, str, str, str]:
    """Devuelve project, location, dataset, store desde gcloud o placeholders."""
    try:
        proj = subprocess.run(
            ["gcloud", "config", "get-value", "project"],
            capture_output=True, text=True, timeout=30,
        )
        project = proj.stdout.strip() or "TU_PROYECTO"
    except Exception:
        project = "TU_PROYECTO"
    return project, "us-central1", "integracion-nacional-dataset", "integracion-nacional-fhir-store"


def metricas(project: str, location: str, dataset: str, store: str) -> None:
    nombre = f"projects/{project}/locations/{location}/datasets/{dataset}/fhirStores/{store}"
    print(f"Consultando metricas de: {nombre}\n")
    try:
        token = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True, text=True, timeout=30, check=True,
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        print("No se pudo obtener token. Ejecuta: gcloud auth login")
        print("Si gcloud esta instalado en Windows, prueba desde PowerShell directamente.")
        return

    import urllib.request

    url = f"https://healthcare.googleapis.com/v1/{nombre}:getFHIRStoreMetrics"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            datos = json.loads(resp.read().decode())
    except Exception as e:
        print(f"No se pudieron leer metricas: {e}")
        print("Verifica que el dataset/store existan (dia 9) o usa HAPI local.")
        return

    metrics = datos.get("metrics", [])
    if not metrics:
        print("Store vacio o sin metricas aun.")
        return
    print(f"{'Tipo':<20} {'Count':>8} {'Bytes':>12}")
    print("-" * 42)
    for m in metrics[:15]:
        print(f"{m.get('resourceType', '?'):<20} {m.get('count', '?'):>8} {m.get('structuredStorageSizeBytes', '?'):>12}")


def main() -> None:
    if not gcloud_ok():
        print("gcloud no instalado. Lee las guias en practica/:")
        print("  - import-synthea.md")
        print("  - iam-roles.md")
        print("Puedes seguir con HAPI local sin GCP.")
        return

    project, location, dataset, store = config()
    print(f"Proyecto GCP: {project}\n")
    metricas(project, location, dataset, store)
    print("\nRecuerda: borra el dataset al terminar (limpieza-gcp.md dia 14).")


if __name__ == "__main__":
    main()
