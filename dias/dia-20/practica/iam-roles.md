# Roles IAM minimos para practicar FHIR en GCP

Principio: **menor privilegio**. No uses Owner/Editor para scripts de practica.

## Roles recomendados

| Rol | Cuando usarlo |
|-----|----------------|
| `roles/healthcare.fhirResourceEditor` | App que crea/lee recursos FHIR |
| `roles/healthcare.fhirResourceReader` | Solo lectura de recursos |
| `roles/healthcare.fhirStoreAdmin` | Crear/configurar stores (solo setup) |
| `roles/healthcare.datasetAdmin` | Crear/borrar datasets (setup + limpieza) |

## Cuenta de servicio (opcional, para backend)

```powershell
gcloud iam service-accounts create fhir-lab-sa --display-name="FHIR Lab SA"
gcloud projects add-iam-policy-binding TU_PROYECTO `
  --member="serviceAccount:fhir-lab-sa@TU_PROYECTO.iam.gserviceaccount.com" `
  --role="roles/healthcare.fhirResourceEditor"
```

Genera clave solo si la necesitas localmente; **nunca** la subas a GitHub.

## Token de usuario (mas simple para practicar)

```powershell
gcloud auth print-access-token
$env:TOKEN = gcloud auth print-access-token
$env:FHIR_BASE_URL = "https://healthcare.googleapis.com/v1/projects/TU_PROYECTO/locations/us-central1/datasets/doctorsv-dataset/fhirStores/doctorsv-fhir-store/fhir"
```

El token caduca en ~1 hora; renueva cuando recibas 401.
