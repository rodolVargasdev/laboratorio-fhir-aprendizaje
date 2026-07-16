# FHIR en Google Cloud: tu servidor R4 administrado

> **En simple:** Google Cloud te alquila un servidor FHIR ya montado, parchado y escalable (Cloud Healthcare API). Tú solo decides dónde vive (proyecto, región, dataset), lo configuras (versión R4 y unas pocas banderas críticas), le hablas con los mismos GET/POST/PUT/DELETE que ya dominas, y al terminar cada sesión lo borras para que la cuenta quede en $0. Este tema convierte tu conocimiento de FHIR "de libro" en operación real sobre infraestructura de producción.

## Jerarquía: dónde vive un servidor FHIR en GCP

En Google Cloud existen dos jerarquías que debes distinguir porque los errores de permisos y facturación casi siempre nacen de confundirlas.

### Jerarquía administrativa de GCP

**Organización -> (carpetas) -> Proyecto -> Recursos.** Todo recurso de GCP vive dentro de un proyecto. El proyecto es la unidad de aislamiento: ahí se habilitan APIs, se asocian cuentas de facturación (billing accounts) y se otorgan la mayoría de los permisos IAM. En una cuenta personal de aprendizaje no tendrás organización: tus proyectos cuelgan directamente de tu cuenta. En la institución sí habrá organización, y las políticas (org policies) heredan hacia abajo: organización -> carpeta -> proyecto -> recurso.

La facturación es un objeto aparte: una **billing account** se *vincula* a proyectos. Sin vínculo de facturación activo, la Healthcare API no funciona aunque esté habilitada. Con vínculo, solo pagas lo que exceda la capa gratuita.

### Jerarquía de datos de salud

**Proyecto -> Location -> Dataset -> FHIR store.**

- **Location**: región donde residen físicamente los datos (ej. `us-central1`, `southamerica-east1`). Decisión de soberanía de datos: para una institución nacional, la residencia de datos es requisito legal antes que técnico.
- **Dataset**: contenedor regional de stores. Un dataset puede contener stores FHIR, DICOM y HL7v2 a la vez; por eso existe esta capa intermedia. Borrar el dataset arrastra todos sus stores.
- **FHIR store**: el servidor FHIR en sí. Aquí se fija la versión (DSTU2, STU3, R4 o R5 — para tu ruta de certificación y para la integración nacional, **R4**) y la configuración de comportamiento.

El endpoint REST resultante:

```
https://healthcare.googleapis.com/v1/projects/PROYECTO/locations/LOCATION/datasets/DATASET/fhirStores/STORE/fhir
```

Todo lo que aprendiste de la API REST de FHIR (interacciones, búsqueda, Bundles, `_history`, `$validate`) aplica sobre esa base. Lo que cambia respecto a `hapi.fhir.org/baseR4`: autenticación obligatoria y responsabilidad tuya sobre configuración, permisos y costos.

### Crear el proyecto y habilitar la API

Puedes hacerlo en la consola (console.cloud.google.com -> New Project -> APIs & Services -> habilitar "Cloud Healthcare API"), pero la vía profesional y reproducible es `gcloud`:

```bash
# 1. Autenticarte y crear el proyecto
gcloud auth login
gcloud projects create fhir-lab-sv-2026 --name="Laboratorio FHIR"
gcloud config set project fhir-lab-sv-2026

# 2. Vincular facturación (lista tus billing accounts y usa su ID)
gcloud billing accounts list
gcloud billing projects link fhir-lab-sv-2026 --billing-account=XXXXXX-XXXXXX-XXXXXX

# 3. Habilitar la Healthcare API
gcloud services enable healthcare.googleapis.com

# 4. Verificar
gcloud services list --enabled --filter="healthcare"
```

El ID de proyecto es global y único; usa un sufijo propio. Crea además una **alerta de presupuesto** en $1 (Billing -> Budgets & alerts): no corta el gasto, pero avisa antes de cualquier sorpresa.

Dataset y store:

```bash
gcloud healthcare datasets create nacional-ds --location=us-central1

gcloud healthcare fhir-stores create store-r4 \
  --dataset=nacional-ds --location=us-central1 \
  --version=R4 --enable-update-create \
  --labels=entorno=lab,proposito=aprendizaje
```

## El FHIR store a fondo: las banderas que importan

La versión FHIR es **inmutable**: no puedes migrar un store de STU3 a R4; se crea uno nuevo y se re-ingesta. Las demás opciones definen el contrato de comportamiento del servidor:

### enableUpdateCreate

Con esta bandera activa, un `PUT` a un ID que no existe **crea** el recurso con ese ID (upsert). Es indispensable en integraciones donde el sistema origen es dueño de los identificadores (por ejemplo, el expediente nacional asigna el ID y todos los nodos hacen `PUT Patient/{id-nacional}`). Desactivada, `PUT` a un ID inexistente falla y solo `POST` crea (con ID asignado por el servidor). En una red nacional con IDs gobernados centralmente, la querrás activa; en un store donde el servidor es la fuente de verdad de IDs, apagada.

### disableReferentialIntegrity

Por defecto el store **rechaza** recursos que referencian a otros que no existen (una Observation con `subject: Patient/999` inexistente devuelve error). Desactivar la integridad referencial (`--disable-referential-integrity` al crear; es inmutable) permite ingestar en cualquier orden. **Cuándo**: cargas masivas donde el orden de llegada no garantiza que el Patient entre antes que sus Observations, o federaciones donde la referencia apunta a otro servidor. **Riesgo**: aceptas referencias colgantes permanentemente; las búsquedas encadenadas (`Observation?subject.name=...`) y `_include` devolverán huecos silenciosos. En producción nacional: intégridad activa en el store maestro, y una zona de aterrizaje (staging store) sin integridad para ingesta cruda.

### Versionado de recursos

Por defecto cada update genera una versión (`meta.versionId` incrementa) y el historial queda disponible:

```
GET [base]/Patient/123/_history        # todas las versiones
GET [base]/Patient/123/_history/2      # vread de la versión 2
```

Puede desactivarse al crear el store (`--disable-resource-versioning`), lo que reduce almacenamiento pero elimina el rastro de cambios. Para datos clínicos de una institución pública, el versionado es parte de la trazabilidad: déjalo activo.

### Notificaciones Pub/Sub

El store puede publicar un mensaje en un tópico de Pub/Sub por cada creación/actualización/borrado:

```bash
gcloud pubsub topics create fhir-cambios
gcloud healthcare fhir-stores update store-r4 \
  --dataset=nacional-ds --location=us-central1 \
  --pubsub-topic=projects/fhir-lab-sv-2026/topics/fhir-cambios
```

Esto habilita arquitecturas dirigidas por eventos: un suscriptor recalcula indicadores epidemiológicos cuando llega una Observation nueva, sin polling. Requisito operativo: la cuenta de servicio del servicio Healthcare (service agent) necesita permiso `pubsub.publisher` sobre el tópico; si falta, las notificaciones se pierden sin romper el CRUD.

### Labels

Pares clave-valor (`entorno=lab`) para organizar y filtrar costos por store en los reportes de facturación. Gratis y muy útil cuando administres decenas de stores institucionales.

## CRUD real con curl y el token de acceso

GCP no acepta peticiones anónimas. Cada llamada lleva un access token OAuth 2.0 de tu identidad (dura ~1 hora):

```bash
TOKEN=$(gcloud auth print-access-token)
BASE="https://healthcare.googleapis.com/v1/projects/fhir-lab-sv-2026/locations/us-central1/datasets/nacional-ds/fhirStores/store-r4/fhir"
```

Crear un Patient (POST -> el servidor asigna el ID):

```bash
curl -sS -X POST "$BASE/Patient" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "identifier": [{
      "system": "https://fhir.salud.gob.sv/identificadores/dui",
      "value": "04567890-1"
    }],
    "name": [{"family": "Ramírez", "given": ["Ana"]}],
    "gender": "female",
    "birthDate": "1988-04-12"
  }'
```

La respuesta incluye `id` y `meta.versionId: "1"`. Con ese ID:

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/Patient/ID_ASIGNADO"          # read
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/Patient?identifier=https://fhir.salud.gob.sv/identificadores/dui|04567890-1"   # search
curl -sS -H "Authorization: Bearer $TOKEN" "$BASE/metadata" | head -40           # CapabilityStatement
```

Update con control de concurrencia optimista (evita pisar cambios ajenos):

```bash
curl -sS -X PUT "$BASE/Patient/ID_ASIGNADO" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/fhir+json" \
  -H 'If-Match: W/"1"' \
  -d @paciente_actualizado.json
```

Si otra petición ya subió la versión, recibes `412 Precondition Failed` en lugar de sobreescribir. Los Bundles `transaction` se envían con `POST $BASE` (la raíz), igual que en HAPI.

## Carga masiva y analítica: Synthea, GCS, import/export y BigQuery

### Generar pacientes sintéticos con Synthea

Nunca practiques con datos reales. Synthea genera poblaciones ficticias clínicamente coherentes en FHIR R4:

```bash
# Requiere Java 11+. Descarga synthea-with-dependencies.jar desde el sitio oficial.
java -jar synthea-with-dependencies.jar \
  -p 50 -s 20260715 \
  --exporter.fhir.bulk_data true \
  --exporter.baseDirectory ./salida \
  Massachusetts
```

`-p 50` genera 50 pacientes vivos; `-s` fija la semilla (reproducibilidad); `--exporter.fhir.bulk_data true` produce **NDJSON** (un recurso por línea, un archivo por tipo: `Patient.ndjson`, `Observation.ndjson`...) en vez de Bundles JSON. Synthea solo modela geografía de EE. UU.; para el laboratorio es irrelevante, y para demos nacionales luego ajustas nombres e identifiers en un paso de transformación.

### Import desde Cloud Storage

```bash
gcloud storage buckets create gs://fhir-lab-sv-2026-datos --location=us-central1
gcloud storage cp ./salida/fhir/*.ndjson gs://fhir-lab-sv-2026-datos/synthea/

gcloud healthcare fhir-stores import gcs store-r4 \
  --dataset=nacional-ds --location=us-central1 \
  --gcs-uri=gs://fhir-lab-sv-2026-datos/synthea/*.ndjson \
  --content-structure=resource
```

`--content-structure=resource` declara "un recurso FHIR por línea"; con `bundle` cada línea sería un Bundle completo. El import es una **operación de larga duración** (LRO): el comando espera, o puedes listar operaciones con `gcloud healthcare operations list --dataset=nacional-ds --location=us-central1`. Errores típicos: el service agent del Healthcare API sin permiso de lectura sobre el bucket (`roles/storage.objectViewer`), NDJSON con líneas en blanco o "pretty-printed" (multi-línea), y violaciones de integridad referencial si el store la tiene activa y los archivos entran desordenados.

Verifica el resultado con métricas del store (conteo por tipo y bytes almacenados) usando la API REST de administración: método `fhirStores.getFHIRStoreMetrics`.

### Export a GCS y a BigQuery

```bash
# Snapshot NDJSON a un bucket (respaldo, intercambio)
gcloud healthcare fhir-stores export gcs store-r4 \
  --dataset=nacional-ds --location=us-central1 \
  --gcs-uri=gs://fhir-lab-sv-2026-datos/export/

# Export analítico a BigQuery
bq mk --location=us-central1 fhir_analitica
gcloud healthcare fhir-stores export bq store-r4 \
  --dataset=nacional-ds --location=us-central1 \
  --bq-dataset=bq://fhir-lab-sv-2026.fhir_analitica \
  --schema-type=analytics
```

`--schema-type=analytics` aplana los recursos al esquema SQL sobre FHIR (columnas anidadas y repetidas; hay una variante `analytics_v2` en la API con soporte más completo de extensiones); `lossless` conserva el JSON íntegro. Con los datos en BigQuery haces epidemiología con SQL estándar:

```sql
SELECT gender, COUNT(*) AS pacientes
FROM `fhir-lab-sv-2026.fhir_analitica.Patient`
GROUP BY gender;
```

Este trío import/export/BigQuery es exactamente el patrón de un nodo analítico nacional: los sistemas asistenciales escriben FHIR; los tableros de salud pública leen BigQuery.

## IAM, auditoría y el modelo de costos

### Roles de healthcare y mínimo privilegio

Nunca operes ni programes con `roles/owner`. Los roles que debes dominar:

| Rol | Permite | Úsalo para |
|---|---|---|
| `roles/healthcare.fhirResourceReader` | Leer recursos FHIR | Apps y reportes de solo lectura |
| `roles/healthcare.fhirResourceEditor` | CRUD de recursos FHIR | Scripts de integración que escriben datos |
| `roles/healthcare.fhirStoreAdmin` | Crear/configurar/borrar stores, import/export | Automatización de infraestructura, no apps |
| `roles/healthcare.datasetAdmin` | Administrar datasets completos | Solo el equipo de plataforma |
| `roles/healthcare.datasetViewer` | Leer metadatos de datasets | Inventario y monitoreo |

Para procesos no humanos se crean **cuentas de servicio** con el rol mínimo:

```bash
gcloud iam service-accounts create integrador-lab \
  --display-name="Integrador de laboratorio"

gcloud projects add-iam-policy-binding fhir-lab-sv-2026 \
  --member="serviceAccount:integrador-lab@fhir-lab-sv-2026.iam.gserviceaccount.com" \
  --role="roles/healthcare.fhirResourceEditor"
```

Mejor aún: otorga el rol a nivel de dataset o de store (condiciones/recurso específico), no del proyecto. Las claves JSON de cuentas de servicio jamás se suben a git; en GCP prefiere la *service account impersonation* (`gcloud auth print-access-token --impersonate-service-account=...`) que no genera archivos de clave.

### Auditoría

Cloud Audit Logs registra quién hizo qué: los **Admin Activity logs** (crear/borrar stores, cambios IAM) están siempre activos y son gratuitos; los **Data Access logs** (lecturas/escrituras de recursos FHIR) deben habilitarse explícitamente para la Healthcare API y generan volumen facturable en Cloud Logging. En un sistema nacional, los Data Access logs son obligatorios: son tu evidencia de quién consultó el expediente de quién.

### Qué cuesta y qué es gratis

| Concepto | Genera costo | Nota |
|---|---|---|
| Almacenamiento estructurado del store | Sí, por GiB al mes (prorrateado por hora) | Se detiene al borrar dataset/store |
| Peticiones estándar (CRUD, search) | Sí, por bloque de peticiones | Capa gratuita mensual la cubre de sobra en laboratorio |
| Operaciones import/export (ETL) | Sí, por GiB procesado | Volúmenes de laboratorio: centavos o $0 |
| Notificaciones Pub/Sub | Lado Pub/Sub factura aparte | Tópico sin suscriptores casi no cuesta |
| BigQuery (almacenamiento + consultas) | Sí, con capa gratuita propia (1 TiB de consulta/mes) | Borra el dataset de BQ al terminar |
| Cloud Storage (bucket) | Sí, por GiB-mes | Borra el bucket al terminar |
| Admin Activity audit logs | No | Siempre activos |

La capa gratuita histórica de la Healthcare API ronda **25,000 peticiones estándar/mes y 1 GiB de almacenamiento (medido en GiB-hora)**; verifica las cifras vigentes en la página oficial de precios antes de cada ciclo de práctica, porque son la única fuente de verdad. Con la disciplina de limpieza, tu consumo real será $0.

### Limpieza total (el ritual de cierre)

```bash
gcloud healthcare datasets delete nacional-ds --location=us-central1 --quiet
gcloud storage rm -r gs://fhir-lab-sv-2026-datos
bq rm -r -f -d fhir-lab-sv-2026:fhir_analitica
# Opción nuclear al terminar el tema completo:
gcloud projects delete fhir-lab-sv-2026 --quiet
```

Borrar el dataset elimina stores y datos (irreversible). Borrar el proyecto lo deja 30 días en papelera y detiene toda facturación asociada.

## Errores comunes y gotchas

- **`401 Unauthorized` a media sesión**: el token de `gcloud auth print-access-token` expira (~1 h). Regenera el token; no "arregles" la petición.
- **`403 Permission denied` con token fresco**: problema IAM, no de autenticación. Revisa rol, y a qué nivel (proyecto vs dataset vs store) fue otorgado. `PERMISSION_DENIED` también aparece si la API no está habilitada en el proyecto.
- **`404` con URL "casi" correcta**: el endpoint tiene 8 segmentos antes de `/fhir`; un typo en location o dataset produce 404 genérico. Compara contra el patrón completo.
- **Import que "termina" con errores parciales**: la LRO puede completar con contadores de fallos. Revisa `gcloud healthcare operations describe` y los logs; no asumas éxito porque el comando regresó.
- **NDJSON inválido**: archivos pretty-printed (un recurso en varias líneas) o con BOM rompen el import con `--content-structure=resource`.
- **Integridad referencial vs orden de carga**: con integridad activa, importar `Observation.ndjson` antes que `Patient.ndjson` falla. El import de GCP resuelve dentro de una misma operación multi-archivo, pero cargas incrementales por partes sí sufren el problema.
- **`412 Precondition Failed`**: tu `If-Match` no coincide con la versión actual. Es la concurrencia optimista funcionando: relee y reintenta.
- **Confundir el endpoint de administración con el de datos**: crear stores es `.../fhirStores` (API de administración); leer pacientes es `.../fhirStores/STORE/fhir/Patient` (API FHIR). Los roles requeridos difieren.
- **Olvidar que la alerta de presupuesto no corta gasto**: solo notifica. El único freno real es borrar recursos.

## Nivel experto

- **Búsqueda avanzada en el store**: GCP implementa la mayoría de parámetros R4, `_include`/`_revinclude`, `_sort`, `_count`, y paginación por token en el link `next` (no números de página). Su CapabilityStatement es el contrato exacto: consúltalo antes de asumir soporte de un parámetro.
- **`Patient/$everything`** está soportado y es la vía rápida para extraer el expediente completo de un paciente en el store.
- **executeBundle y límites**: los Bundles transaction tienen límite de tamaño operativo; para cargas grandes, el import de GCS siempre gana en costo y robustez frente a miles de POSTs.
- **Consent enforcement y de-identificación**: la Healthcare API ofrece `datasets.deidentify` y stores con aplicación de directivas de consentimiento; en analítica nacional, exportar una copia de-identificada a BigQuery reduce el riesgo regulatorio.
- **R5 disponible, R4 decidido**: que el store soporte R5 no cambia tu decisión: el ecosistema de IGs (US Core, IPS) y las certificaciones viven en R4. La estrategia experta es R4 con perfiles bien gobernados y monitoreo del avance normativo de R6.
- **Infraestructura como código**: en la institución, datasets, stores, tópicos y bindings IAM se declaran en Terraform (`google_healthcare_fhir_store`), no se crean a mano. Tu `gcloud` de laboratorio es el prototipo del módulo Terraform de producción.
- **Cuotas**: además del costo, hay cuotas de QPS por proyecto. Un integrador masivo mal escrito (sin backoff exponencial ante `429`) se estrangula solo. Diseña reintentos con jitter desde el día uno.

## Chuleta

| Necesito | Comando / dato |
|---|---|
| Jerarquía de datos | Proyecto -> Location -> Dataset -> FHIR store |
| Habilitar API | `gcloud services enable healthcare.googleapis.com` |
| Crear dataset | `gcloud healthcare datasets create nacional-ds --location=us-central1` |
| Crear store R4 | `gcloud healthcare fhir-stores create store-r4 --dataset=nacional-ds --location=us-central1 --version=R4 --enable-update-create` |
| Token | `TOKEN=$(gcloud auth print-access-token)` (expira ~1 h) |
| Endpoint FHIR | `https://healthcare.googleapis.com/v1/projects/P/locations/L/datasets/D/fhirStores/S/fhir` |
| Import NDJSON | `gcloud healthcare fhir-stores import gcs ... --gcs-uri=gs://bucket/*.ndjson --content-structure=resource` |
| Export a BigQuery | `gcloud healthcare fhir-stores export bq ... --bq-dataset=bq://P.dataset --schema-type=analytics` |
| Métricas del store | `fhirStores.getFHIRStoreMetrics` |
| Rol lectura / escritura | `roles/healthcare.fhirResourceReader` / `fhirResourceEditor` |
| Upsert por PUT | Bandera `enableUpdateCreate` del store |
| Referencias sin validar | `disableReferentialIntegrity` (inmutable, riesgo de huérfanos) |
| Eventos por cambio | Notificaciones Pub/Sub del store |
| Limpieza | `gcloud healthcare datasets delete nacional-ds --location=us-central1` + borrar bucket y dataset BQ |

## Autoevaluacion

1. Describe las dos jerarquías (administrativa y de datos de salud) y en cuál de ellas se decide la residencia física de los datos.
2. Tu `PUT Patient/dui-04567890-1` devuelve error "resource not found" en un store nuevo. ¿Qué bandera falta y qué decide activarla o no en producción?
3. ¿Cuándo desactivarías la integridad referencial de un store y qué efecto colateral aceptas al hacerlo?
4. Un import desde GCS falla con error de permisos aunque tú eres Owner del proyecto. ¿Quién necesita el permiso y cuál?
5. ¿Qué diferencia hay entre `--schema-type=analytics` y `lossless` al exportar a BigQuery, y cuándo usarías cada uno?
6. Una app de reportes solo lee Observations de un store concreto. Diseña el binding IAM exacto (identidad, rol, nivel).
7. ¿Qué registran los Admin Activity logs vs los Data Access logs, y cuál debes habilitar explícitamente?
8. Enumera los tres comandos de limpieza que garantizan costo $0 tras una sesión con import y export a BigQuery.

### Respuestas

1. Administrativa: Organización -> carpetas -> Proyecto -> Recursos (facturación e IAM). De datos: Proyecto -> Location -> Dataset -> FHIR store. La residencia física se decide en la **location** del dataset.
2. Falta `enableUpdateCreate` (upsert por PUT). Se activa cuando el sistema origen gobierna los IDs (ID nacional); se apaga cuando el store debe ser la única autoridad de identificadores.
3. Para ingesta masiva/staging donde el orden de llegada no garantiza dependencias, o referencias a recursos externos. Aceptas referencias colgantes permanentes y resultados incompletos en `_include` y búsquedas encadenadas.
4. La cuenta de servicio del servicio Healthcare (service agent) necesita `roles/storage.objectViewer` sobre el bucket de origen. Tu rol personal no participa en la lectura que hace el servicio.
5. `analytics` aplana a un esquema SQL consultable (ideal para BI/epidemiología); `lossless` conserva el JSON completo sin pérdida (ideal para respaldo/reproceso fiel).
6. Cuenta de servicio dedicada + `roles/healthcare.fhirResourceReader` otorgado a nivel del **FHIR store** (no del proyecto): mínimo privilegio en identidad, acción y alcance.
7. Admin Activity: operaciones administrativas (crear/borrar stores, IAM); siempre activos y gratuitos. Data Access: lecturas/escrituras de recursos FHIR; se habilitan explícitamente y facturan volumen de logging.
8. `gcloud healthcare datasets delete nacional-ds --location=us-central1`, `gcloud storage rm -r gs://BUCKET`, `bq rm -r -f -d PROYECTO:fhir_analitica` (o directamente `gcloud projects delete PROYECTO`).

## Para profundizar

- Documentación de FHIR en Cloud Healthcare API: https://cloud.google.com/healthcare-api/docs/fhir
- Guías how-to de FHIR stores (crear, importar, exportar): https://cloud.google.com/healthcare-api/docs/how-tos/fhir
- Página del producto Cloud Healthcare API: https://cloud.google.com/healthcare-api
- Capa gratuita y precios de GCP: https://cloud.google.com/free
- Instalación del SDK de Google Cloud (gcloud): https://cloud.google.com/sdk/docs/install
- Synthea (datos sintéticos): https://synthea.mitre.org/
- API REST de FHIR R4 (la especificación que tu store implementa): http://hl7.org/fhir/R4/http.html
