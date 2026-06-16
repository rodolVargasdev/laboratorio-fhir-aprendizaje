# Dia 20: GCP avanzado (importacion, IAM, metricas y limpieza)

Objetivo: completar la competencia GCP: importar datos sinteticos, roles IAM minimos,
consultar metricas del FHIR store y limpiar recursos para quedar en $0.
Tiempo: 2-3 horas. Costo objetivo: $0 (capa gratuita + borrado al terminar).

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion + guias en `practica/`.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 20`

## Teoria

### Import masivo desde Cloud Storage

Flujo tipico para cargar Synthea (datos ficticios) en tu FHIR store:

1. Subes archivos `.ndjson` a un bucket GCS.
2. Invocas la operacion de import del Healthcare API apuntando al bucket.
3. El servicio ingiere recursos en el FHIR store (validacion incluida).

Comandos detallados: `practica/import-synthea.md`

### IAM: principio de menor privilegio

Roles utiles (no des roles de Owner para practicar):
- `roles/healthcare.fhirResourceEditor` — leer/escribir recursos FHIR
- `roles/healthcare.fhirStoreAdmin` — administrar el store (solo si lo necesitas)
- `roles/healthcare.datasetViewer` — solo lectura de metadatos

Para scripts de practica, preferible una **cuenta de servicio** dedicada con el
rol minimo necesario. Nunca subas el JSON de la clave a git.

### Metricas del FHIR store

El metodo `fhirStores.getFHIRStoreMetrics` devuelve conteo por tipo de recurso y
tamano almacenado. Sirve para estimar coste y verificar que la importacion llego.

### Limpieza obligatoria

Al terminar practicas en nube:

    gcloud healthcare datasets delete doctorsv-dataset --location=us-central1

Ver `dias/dia-14/practica/limpieza-gcp.md`.

## Practica

**Via nube (si tienes GCP configurado):**

```powershell
python dias\dia-20\practica\gcp_metricas.py
```

**Via local (sin GCP):** lee `practica/import-synthea.md` y `practica/iam-roles.md`;
el script te indicara que hacer cuando no hay gcloud.

Reto: documenta en `competencias.json` los dominios gcp_datos y gcp_seguridad con
evidencia cuando completes import o IAM en tu proyecto.

## Reto Feynman

Explica por que borrar el dataset al terminar y que rol IAM minimo usarias para
una app que solo lee Observation.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 20. Tema: GCP Healthcare API avanzado (import
Synthea, IAM, metricas, limpieza $0). Soy desarrollador en DoctorSV, en espanol.
Guiame con menor privilegio IAM, flujo import GCS->FHIR store, lectura de metricas
y limpieza. Avisame de cualquier paso con riesgo de cobro. Al final pideme
explicar el flujo import y la limpieza (Feynman).
