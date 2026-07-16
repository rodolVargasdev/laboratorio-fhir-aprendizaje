# Practica

## Objetivo

Montar de cero un FHIR store R4 en Cloud Healthcare API, poblarlo con pacientes sintéticos de Synthea vía import desde Cloud Storage, ejecutar CRUD y búsqueda autenticados con `curl`, exportar a BigQuery para analítica SQL, y desmontarlo todo dejando la cuenta en costo $0.

## Preparacion

- Cuenta de Google con facturación verificada (no se cobrará si respetas la capa gratuita y la limpieza final). Crea la alerta de presupuesto en $1 antes de empezar.
- `gcloud` CLI instalado y autenticado (`gcloud auth login`); ver [Setup](/setup). Verifica con `gcloud --version`.
- `curl` y Java 11+ (para Synthea). En Windows usa Git Bash o Cloud Shell (Cloud Shell ya trae todo).
- Descarga `synthea-with-dependencies.jar` desde el sitio oficial de Synthea.
- Define variables (ajusta el ID de proyecto a uno único tuyo):

```bash
export PROJECT=fhir-lab-sv-2026
export LOCATION=us-central1
export DATASET=nacional-ds
export STORE=store-r4
export BUCKET=gs://$PROJECT-datos
```

## Ejercicios guiados

1. **Proyecto y API habilitada.**

   ```bash
   gcloud projects create $PROJECT --name="Laboratorio FHIR"
   gcloud config set project $PROJECT
   gcloud billing accounts list
   gcloud billing projects link $PROJECT --billing-account=TU-BILLING-ID
   gcloud services enable healthcare.googleapis.com
   ```

   Salida esperada del último comando: `Operation ... finished successfully.` Verifica: `gcloud services list --enabled --filter=healthcare` debe listar `healthcare.googleapis.com`.

2. **Dataset y FHIR store R4.**

   ```bash
   gcloud healthcare datasets create $DATASET --location=$LOCATION
   gcloud healthcare fhir-stores create $STORE \
     --dataset=$DATASET --location=$LOCATION \
     --version=R4 --enable-update-create
   ```

   Salida esperada: `Created fhirStore [store-r4].` Verifica: `gcloud healthcare fhir-stores describe $STORE --dataset=$DATASET --location=$LOCATION` muestra `version: R4` y `enableUpdateCreate: true`.

3. **CRUD autenticado con curl.**

   ```bash
   TOKEN=$(gcloud auth print-access-token)
   BASE="https://healthcare.googleapis.com/v1/projects/$PROJECT/locations/$LOCATION/datasets/$DATASET/fhirStores/$STORE/fhir"

   curl -sS -X POST "$BASE/Patient" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/fhir+json" \
     -d '{"resourceType":"Patient","identifier":[{"system":"https://fhir.salud.gob.sv/identificadores/dui","value":"04567890-1"}],"name":[{"family":"Ramírez","given":["Ana"]}],"gender":"female","birthDate":"1988-04-12"}'
   ```

   Salida esperada: el Patient creado con `"id"` asignado y `"meta":{"versionId":"1",...}`. Verifica con búsqueda por identificador:

   ```bash
   curl -sS -H "Authorization: Bearer $TOKEN" \
     "$BASE/Patient?identifier=https://fhir.salud.gob.sv/identificadores/dui|04567890-1"
   ```

   Debe devolver un `Bundle` tipo `searchset` con `"total": 1`.

4. **Generar 20 pacientes con Synthea y subirlos a GCS.**

   ```bash
   java -jar synthea-with-dependencies.jar -p 20 -s 20260715 \
     --exporter.fhir.bulk_data true --exporter.baseDirectory ./salida Massachusetts

   gcloud storage buckets create $BUCKET --location=$LOCATION
   gcloud storage cp ./salida/fhir/*.ndjson $BUCKET/synthea/
   ```

   Salida esperada: Synthea reporta `Records: total=20...` y el `cp` lista los `.ndjson` copiados. Verifica: `gcloud storage ls $BUCKET/synthea/` muestra `Patient.ndjson`, `Observation.ndjson`, etc.

5. **Import masivo al store.**

   ```bash
   gcloud healthcare fhir-stores import gcs $STORE \
     --dataset=$DATASET --location=$LOCATION \
     --gcs-uri=$BUCKET/synthea/*.ndjson \
     --content-structure=resource
   ```

   Salida esperada: la operación termina con un resumen sin errores (si falla por permisos, otorga `roles/storage.objectViewer` al service agent de Healthcare sobre el bucket). Verifica contando pacientes:

   ```bash
   curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/Patient?_summary=count"
   ```

   Debe devolver `"total"` igual o mayor a 21 (tus 20 de Synthea + Ana Ramírez).

6. **Export a BigQuery y consulta SQL.**

   ```bash
   bq mk --location=$LOCATION fhir_analitica
   gcloud healthcare fhir-stores export bq $STORE \
     --dataset=$DATASET --location=$LOCATION \
     --bq-dataset=bq://$PROJECT.fhir_analitica \
     --schema-type=analytics

   bq query --use_legacy_sql=false \
     "SELECT gender, COUNT(*) AS n FROM \`$PROJECT.fhir_analitica.Patient\` GROUP BY gender"
   ```

   Salida esperada: tabla con filas `male`/`female` y conteos que suman el total de pacientes.

7. **IAM de mínimo privilegio.**

   ```bash
   gcloud iam service-accounts create lector-reportes
   gcloud projects add-iam-policy-binding $PROJECT \
     --member="serviceAccount:lector-reportes@$PROJECT.iam.gserviceaccount.com" \
     --role="roles/healthcare.fhirResourceReader"
   ```

   Verifica: `gcloud projects get-iam-policy $PROJECT --flatten="bindings[].members" --filter="bindings.members:lector-reportes*"` muestra solo el rol de lectura.

## Limpieza

Ejecuta SIEMPRE al terminar la sesión; es lo que garantiza costo $0:

```bash
gcloud healthcare datasets delete $DATASET --location=$LOCATION --quiet
gcloud storage rm -r $BUCKET
bq rm -r -f -d $PROJECT:fhir_analitica
gcloud iam service-accounts delete lector-reportes@$PROJECT.iam.gserviceaccount.com --quiet
```

Al cerrar el tema por completo, opción nuclear:

```bash
gcloud projects delete $PROJECT --quiet
```

Verifica: `gcloud healthcare datasets list --location=$LOCATION` vacío, `gcloud storage ls` sin el bucket, y en la consola Billing -> Reports el costo del día en $0.

## Retos

1. **Upsert nacional**: haz `PUT $BASE/Patient/dui-04567890-1` con un Patient completo. Éxito: se crea con ese ID exacto (gracias a `enableUpdateCreate`) y un segundo PUT sube `versionId` a 2.
2. **Concurrencia optimista**: repite el PUT con `If-Match: W/"1"` cuando la versión ya es 2. Éxito: recibes `412 Precondition Failed`.
3. **Notificaciones**: crea un tópico Pub/Sub, configúralo en el store, crea un Patient y lee el mensaje con una suscripción pull. Éxito: el mensaje contiene el nombre del recurso creado.
4. **Integridad referencial**: intenta crear una Observation cuyo `subject` apunte a `Patient/no-existe`. Éxito: explicas el resultado observado según la configuración de tu store.
5. **Historial**: actualiza dos veces a Ana y recupera `GET $BASE/Patient/{id}/_history`. Éxito: Bundle tipo `history` con 3 entradas.
6. **Métricas**: llama a `fhirStores.getFHIRStoreMetrics` vía REST. Éxito: obtienes conteo por tipo de recurso coherente con tu import.

## Reto Feynman

Explica en 10 líneas, como si se lo contaras al director de informática de la institución: por qué un FHIR store administrado en GCP puede costar $0 mientras aprendes, qué tres conceptos generan costo real en producción, y qué disciplina operativa (IAM mínimo, auditoría, limpieza/infraestructura como código) propondrías desde el primer día.

## Criterio de completado

- [ ] Proyecto creado, facturación vinculada, alerta de presupuesto en $1 y Healthcare API habilitada.
- [ ] FHIR store R4 con `enableUpdateCreate` creado y descrito con `gcloud`.
- [ ] Patient creado, buscado por identifier y actualizado con `If-Match` vía `curl`.
- [ ] 20 pacientes Synthea importados desde GCS sin errores y verificados con `_summary=count`.
- [ ] Export a BigQuery ejecutado y consulta SQL con resultados coherentes.
- [ ] Cuenta de servicio de solo lectura creada con rol `fhirResourceReader`.
- [ ] Al menos 4 de los 6 retos completados con su criterio de éxito.
- [ ] Limpieza total ejecutada y verificada (datasets, bucket, BigQuery; costo $0).
