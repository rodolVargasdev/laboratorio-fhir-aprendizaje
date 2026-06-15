# Via nube: crear dataset y FHIR store (capa gratuita)

Requisitos: completaste la Via A del dia 8 (proyecto, facturacion, gcloud, API
habilitada, alerta de presupuesto en 1 dolar).

## Paso 1: crear el dataset

```powershell
gcloud healthcare datasets create doctorsv-dataset --location=us-central1
```

## Paso 2: crear el FHIR store version R4

```powershell
gcloud healthcare fhir-stores create doctorsv-fhir-store `
  --dataset=doctorsv-dataset `
  --location=us-central1 `
  --version=R4 `
  --enable-update-create
```

(El acento grave al final de cada linea continua el comando en PowerShell.)

## Paso 3: confirmar

```powershell
gcloud healthcare fhir-stores list `
  --dataset=doctorsv-dataset `
  --location=us-central1
```

## Paso 4: obtener un token para llamar al store por REST

```powershell
$env:TOKEN = gcloud auth print-access-token
$env:FHIR_BASE_URL = "https://healthcare.googleapis.com/v1/projects/$(gcloud config get-value project)/locations/us-central1/datasets/doctorsv-dataset/fhirStores/doctorsv-fhir-store/fhir"
```

El token caduca en ~1 hora; vuelve a ejecutar la primera linea si expira.

## Coste estimado de esta practica

Crear el store y manejar unas cientos de peticiones y unos pocos MB cae dentro de
la capa gratuita (25,000 req/mes, 1 GiB-hora/mes). Coste esperado: 0 dolares.
Aun asi, en el dia 13/14 borraremos el dataset para quedar a cero.
