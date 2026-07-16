# Importar datos Synthea en Cloud Healthcare API (capa gratuita)

Datos **ficticios** unicamente. Usa pocos archivos para no superar la capa gratis.

## Paso 1: descargar muestra Synthea

Desde https://synthea.mitre.org/downloads elige un bundle FHIR R4 pequeno
(por ejemplo 10 pacientes). Formato: archivos `.ndjson` (un recurso JSON por linea).

## Paso 2: subir a Cloud Storage

```powershell
# Crear bucket (nombre unico globalmente)
gsutil mb -l us-central1 gs://integracion-nacional-fhir-lab-TU_INICIALES/

# Subir archivos
gsutil cp .\ruta\a\synthea\*.ndjson gs://integracion-nacional-fhir-lab-TU_INICIALES/synthea/
```

## Paso 3: importar al FHIR store

```powershell
gcloud healthcare fhir-stores import gcs integracion-nacional-fhir-store `
  --dataset=integracion-nacional-dataset `
  --location=us-central1 `
  --gcs-uri=gs://integracion-nacional-fhir-lab-TU_INICIALES/synthea/*.ndjson `
  --content-structure=resource
```

Espera a que termine la operacion (puede tardar varios minutos).

## Paso 4: verificar con REST o metricas

```powershell
python dias\dia-20\practica\gcp_metricas.py
```

## Paso 5: limpiar (obligatorio)

```powershell
gsutil -m rm -r gs://integracion-nacional-fhir-lab-TU_INICIALES/
gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1
```

Coste esperado con muestra pequena: $0 dentro de la capa gratuita.
