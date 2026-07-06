# 📱 Tema 8 · FHIR en Google Cloud

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Entender la jerarquía completa: proyecto > location > dataset > FHIR store.
- Crear y consultar un FHIR store R4 con `gcloud` y `curl` sin gastar un centavo.
- Autenticarte contra el endpoint FHIR de Google con un token de acceso.
- Importar datos sintéticos (Synthea) desde Cloud Storage en formato NDJSON.
- Aplicar roles IAM de healthcare con el principio de menor privilegio.
- Limpiar todo al terminar para garantizar costo $0.

## Lectura

### La jerarquía: dónde vive tu servidor FHIR

En Google Cloud todo recurso vive dentro de un **proyecto** (que es donde se asocia la facturación). Dentro del proyecto, los recursos de salud siguen esta cadena:

**Proyecto > Location > Dataset > FHIR store**

Piénsalo como un hospital: el proyecto es el edificio, la location es la ciudad donde está (ej. `us-central1`), el dataset es un archivo general de expedientes, y el FHIR store es un archivero específico dentro de ese archivo. Un dataset puede contener varios FHIR stores (y también stores DICOM o HL7v2, por eso existe la capa dataset).

Al crear el FHIR store eliges la **versión de FHIR**. Para tu ruta de certificación siempre es **R4**. Esa elección es fija: no puedes cambiar la versión de un store existente.

El endpoint REST resultante sigue este patrón:

```
https://healthcare.googleapis.com/v1/projects/PROYECTO/locations/LOCATION/datasets/DATASET/fhirStores/STORE/fhir
```

Sobre esa URL usas los mismos GET/POST/PUT/DELETE que ya conoces de los temas de REST. FHIR es FHIR: lo que cambia es quién hospeda el servidor y cómo te autenticas.

### Por qué GCP pide token y el servidor público no

El servidor público HAPI (hapi.fhir.org) es un sandbox abierto: cualquiera lee y escribe. Tu FHIR store en GCP es TUYO, y Google no deja pasar ninguna petición sin un **access token** válido. Lo obtienes así:

```
gcloud auth print-access-token
```

Ese comando imprime un token OAuth 2.0 de corta duración (~1 hora) ligado a tu identidad de Google. Lo mandas en cada petición:

```
Authorization: Bearer <token>
```

Error común: copiar el token una vez y usarlo horas después. Cuando expira recibes `401 Unauthorized`. La solución es regenerarlo, no "arreglar" tu petición.

### La capa gratuita: aprender sin gastar

Cloud Healthcare API tiene **capa gratuita permanente**: 25,000 peticiones/mes y 1 GiB-hora/mes de almacenamiento. Para aprender sobra muchísimo: un día intenso de práctica son quizá 200 peticiones.

Dos disciplinas de seguridad:
1. **Alerta de presupuesto en $1**: no bloquea cobros, pero te avisa antes de que algo se salga de control.
2. **Borrar el dataset al terminar** cada sesión de práctica (ver limpieza abajo). El almacenamiento se cobra por GiB-hora: si no hay datos guardados, no hay reloj corriendo.

Plan B sin tarjeta: un servidor HAPI FHIR local con Docker. Las prácticas del laboratorio leen la variable `FHIR_BASE_URL`, así que funcionan igual con nube o local.

### Cargar datos: referencias y Bundles

Para practicar nunca uses datos reales; usa datos sintéticos como los de **Synthea**, que genera pacientes ficticios con historia clínica completa en formato FHIR.

Los recursos se enlazan por **referencias**. Una Observation apunta a su paciente:

```json
"subject": { "reference": "Patient/123" }
```

Así los datos del paciente viven en un solo lugar y las observaciones solo lo señalan. Errores comunes: olvidar el prefijo del tipo (escribir `"123"` en vez de `"Patient/123"`) o crear la Observation sin `subject` (queda huérfana y las búsquedas por paciente no la encuentran).

Para cargar varios recursos relacionados de forma atómica, se envía un **Bundle tipo `transaction`** con POST a la base del servidor: o entra todo, o no entra nada.

### Import masivo desde Cloud Storage

Para volúmenes grandes (los cientos de recursos de un export de Synthea) el flujo profesional es:

1. Subes archivos **`.ndjson`** (un recurso FHIR por línea) a un bucket de Cloud Storage.
2. Invocas la operación de **import** del Healthcare API apuntando al bucket (`gs://bucket/*.ndjson`).
3. El servicio ingiere los recursos en el FHIR store, con validación incluida. Es una operación de larga duración: la lanzas y consultas su estado.

¿Por qué NDJSON y no un JSON gigante? Porque permite procesar línea por línea en paralelo, sin cargar todo en memoria. Es el mismo formato que usa Bulk Data en la dirección contraria (export).

Para verificar que la importación llegó, el método `fhirStores.getFHIRStoreMetrics` devuelve el conteo por tipo de recurso y el tamaño almacenado — también te sirve para estimar cuánto estás usando de la capa gratuita.

### IAM: menor privilegio siempre

Nunca practiques con rol de Owner. Los roles de healthcare que debes conocer:

- `roles/healthcare.fhirResourceEditor` — leer y escribir recursos FHIR (el típico para tus scripts).
- `roles/healthcare.fhirStoreAdmin` — administrar el store en sí (crear, borrar, configurar). Solo si lo necesitas.
- `roles/healthcare.datasetViewer` — solo lectura de metadatos del dataset.

El **principio de menor privilegio**: cada identidad recibe exactamente los permisos que su tarea exige, ni uno más. Una app de DoctorSV que solo lee observaciones no necesita poder borrar el store. Para scripts, lo correcto es una **cuenta de servicio** dedicada con el rol mínimo — y su clave JSON jamás se sube a git.

### Limpieza: el ritual de costo $0

Al terminar cada sesión en la nube, borra el dataset (arrastra consigo sus stores y datos):

```
gcloud healthcare datasets delete doctorsv-dataset --location=us-central1
```

Recrearlo mañana toma 2 minutos. Dejarlo vivo toda la noche consume GiB-hora sin darte nada. La limpieza no es paranoia: es un hábito profesional de gestión de costos.

## Chuleta

| Necesito... | Comando / dato |
|---|---|
| Token de acceso | `gcloud auth print-access-token` |
| Crear dataset | `gcloud healthcare datasets create doctorsv-dataset --location=us-central1` |
| Crear FHIR store R4 | `gcloud healthcare fhir-stores create mi-store --dataset=doctorsv-dataset --location=us-central1 --version=R4` |
| Endpoint FHIR | `https://healthcare.googleapis.com/v1/projects/P/locations/L/datasets/D/fhirStores/S/fhir` |
| Leer un paciente | `curl -H "Authorization: Bearer $TOKEN" $BASE/Patient/123` |
| Import desde GCS | operación import apuntando a `gs://bucket/*.ndjson` |
| Métricas del store | método `fhirStores.getFHIRStoreMetrics` |
| Rol para scripts CRUD | `roles/healthcare.fhirResourceEditor` |
| Rol solo metadatos | `roles/healthcare.datasetViewer` |
| Limpieza | `gcloud healthcare datasets delete doctorsv-dataset --location=us-central1` |
| Capa gratuita | 25,000 req/mes + 1 GiB-hora/mes |

## Autoevaluación (sin mirar arriba)

1. Ordena de mayor a menor la jerarquía donde vive un FHIR store en GCP y di qué contiene cada nivel.
2. ¿Por qué el endpoint de GCP exige `Authorization: Bearer <token>` y el HAPI público no? ¿Con qué comando obtienes el token?
3. Describe el flujo de import masivo de Synthea: formato de archivo, dónde se sube y qué hace el Healthcare API.
4. Una app de DoctorSV solo lee Observations. ¿Qué rol IAM le asignas y qué principio estás aplicando?
5. ¿Qué dos hábitos garantizan que tu práctica en la nube quede en $0, y cuáles son los límites de la capa gratuita?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 8 GCP".
2. Añade estos enlaces oficiales como fuentes:
   - https://cloud.google.com/healthcare-api — página oficial de Cloud Healthcare API, el producto que estás aprendiendo.
   - https://cloud.google.com/healthcare-api/docs/how-tos/fhir — guía oficial para crear y gestionar FHIR stores.
   - https://cloud.google.com/free — detalle del nivel gratuito de GCP y sus límites.
   - https://synthea.mitre.org/ — generador de datos sintéticos que usarás en los imports.
   - http://hl7.org/fhir/R4/http.html — la API REST de FHIR R4 que tu store implementa.
3. Prompts sugeridos:
   - "Hazme un cuestionario de 10 preguntas sobre la jerarquía proyecto > location > dataset > FHIR store y los roles IAM de healthcare."
   - "Explícame paso a paso, como si fuera un runbook, el flujo completo: crear dataset y store, obtener token, importar NDJSON desde Cloud Storage y borrar todo al final."
   - "Compara el FHIR store de GCP con un servidor HAPI local: autenticación, costos, casos de uso. ¿Cuándo elegiría cada uno en DoctorSV?"

---

### Respuestas

1. Proyecto (unidad de facturación y recursos) > Location (región, ej. us-central1) > Dataset (contenedor regional de stores de salud) > FHIR store (el servidor FHIR con versión fija, R4).
2. Porque el store es privado y Google exige un access token OAuth 2.0 en cada petición; el HAPI público es un sandbox abierto. Token: `gcloud auth print-access-token` (dura ~1 hora).
3. Se generan/exportan recursos en NDJSON (un recurso por línea), se suben a un bucket de Cloud Storage, y se invoca la operación de import del Healthcare API apuntando al bucket; el servicio ingiere y valida los recursos como operación de larga duración. Se verifica con getFHIRStoreMetrics.
4. `roles/healthcare.fhirResourceEditor` sería excesivo si solo lee; lo ideal es el permiso mínimo de lectura disponible (y nunca Owner). El principio aplicado es el de menor privilegio, idealmente con una cuenta de servicio dedicada.
5. Hábitos: alerta de presupuesto en $1 y borrar el dataset al terminar cada sesión (`gcloud healthcare datasets delete ...`). Capa gratuita: 25,000 peticiones/mes y 1 GiB-hora/mes de almacenamiento.
