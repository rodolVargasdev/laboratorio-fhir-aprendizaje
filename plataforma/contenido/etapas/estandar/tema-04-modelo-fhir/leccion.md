# El modelo FHIR: recursos, referencias y Bundles

> **En simple:** FHIR descompone la historia clínica en piezas pequeñas (recursos) construidas con tipos de datos reutilizables, conectadas entre sí por referencias y transportadas en cajas llamadas Bundles. Si dominas la jerarquía Resource -> DomainResource, los tipos de datos, las cinco formas de referenciar y las reglas de Bundle, tienes cubierto el dominio más pesado del examen (Resource Model, 29 %).

## Jerarquía del modelo y elementos comunes

Todo recurso FHIR hereda de una jerarquía de dos niveles que debes poder recitar:

- **Resource** (abstracto): aporta `id`, `meta`, `implicitRules` y `language`. Los recursos de infraestructura pura (`Bundle`, `Parameters`, `Binary`) heredan directamente de aquí, y por eso **no tienen narrativa ni extensiones en la raíz**.
- **DomainResource** (abstracto, hereda de Resource): añade `text` (narrativa), `contained`, `extension` y `modifierExtension`. Casi todos los recursos clínicos y administrativos (Patient, Observation, Condition...) heredan de aquí.

### Los elementos de Resource

| Elemento | Tipo | Qué es |
|---|---|---|
| `id` | id | Identificador **lógico** asignado por el servidor. Inmutable dentro de un servidor, pero cambia si el recurso migra a otro servidor. Regex: `[A-Za-z0-9\-\.]{1,64}` |
| `meta` | Meta | Metadatos: `versionId`, `lastUpdated`, `profile` (canónicas de perfiles que el recurso **afirma** cumplir), `security`, `tag`, `source` |
| `implicitRules` | uri | Referencia a reglas que gobiernan la interpretación. Es un **elemento modificador**: si no la entiendes, no puedes procesar el recurso con seguridad |
| `language` | code | Idioma base del contenido (binding a los códigos de idioma) |

### Los elementos de DomainResource

- **`text`**: narrativa XHTML generada a partir de los datos estructurados. `text.status` puede ser `generated`, `extensions`, `additional` o `empty`.
- **`contained`**: recursos anidados que **no tienen existencia independiente**. Reglas (invariantes dom-1 a dom-5 de R4): un recurso contenido no puede tener narrativa propia, no puede anidar otros contenidos, debe ser referenciado desde el recurso contenedor (con `#id`), y no puede llevar `meta.versionId` ni `meta.lastUpdated`. Úsalo solo cuando el recurso no puede identificarse de forma independiente (p. ej., un medicamento magistral sin catálogo); si el dato tiene identidad propia, referencia normal.
- **`extension`**: datos adicionales que un receptor **puede ignorar** sin riesgo.
- **`modifierExtension`**: datos que **cambian el significado** de los elementos que las contienen. Esta es la trampa de examen: un sistema que recibe una `modifierExtension` que no entiende **no debe procesar el recurso como si no existiera**; debe rechazarlo o manejarlo como excepción. Ejemplo clásico: una extensión que niega una prescripción ("NO administrar"). Ignorarla invierte la semántica clínica.

### Extensiones a fondo

Toda extensión es un par `url` + `value[x]` (o extensiones anidadas en lugar de `value[x]`, nunca ambas):

```json
{
  "extension": [{
    "url": "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
    "valueAddress": { "city": "San Salvador", "country": "SV" }
  }]
}
```

- La `url` es la **canónica de la StructureDefinition** que define la extensión; es la clave para que el receptor sepa qué significa.
- Extensiones **complejas**: la extensión externa lleva `url` absoluta y sus hijas `extension[].url` relativas (solo el nombre del sub-elemento).
- Extensiones **sobre primitivos**: en JSON, un primitivo se extiende con la propiedad hermana prefijada con guion bajo: `"birthDate": "1980-01-01", "_birthDate": { "extension": [...] }`.
- El sufijo del elemento decide la gravedad: `extension` ignorable, `modifierExtension` no.

### Compartimentos

Un compartimento agrupa los recursos ligados a un eje (Patient, Encounter, Practitioner, Device, RelatedPerson). Su uso más visible es la operación `GET [base]/Patient/123/$everything`, que devuelve un Bundle con todo lo relacionado al paciente 123 — pieza central de intercambio de historia clínica completa.

## Tipos de datos: primitivos, generales y especiales

### Primitivos con reglas (no son "strings libres")

| Tipo | Regla que cae en examen |
|---|---|
| `string` | Máx. 1 MB; **no puede ser cadena vacía** (en FHIR ningún elemento puede estar presente y vacío) |
| `code` | String sin espacios al inicio/fin y sin espacios dobles internos; siempre viene de un conjunto definido |
| `id` | `[A-Za-z0-9\-\.]{1,64}` |
| `uri` / `url` / `canonical` | `uri` es sensible a mayúsculas; `canonical` referencia la URL canónica de un recurso de conformidad y admite versión con `|` (p. ej. `http://hl7.org/fhir/ValueSet/observation-status|4.0.1`) |
| `decimal` | Conserva la precisión (0.010 ≠ 0.01 en significancia); no usar float binario al procesar |
| `date` | Precisión variable: `2026`, `2026-07` o `2026-07-15`. Sin zona horaria |
| `dateTime` | Si incluye hora, la **zona horaria es obligatoria** |
| `instant` | Precisión al menos de segundo **y** zona horaria obligatoria; es una marca de tiempo de sistema (p. ej. `meta.lastUpdated`) |
| `base64Binary` | Contenido binario en base64 (usado por Attachment.data) |

### Tipos generales

- **Identifier**: identificador **de negocio** con `system` (URI del espacio de nombres: quién lo emite) + `value`, más `use` y `type`. **Identifier ≠ id lógico**: el `id` es técnico, local a un servidor y asignado por él; el Identifier (DUI, número de expediente, NIT) identifica a la entidad en el mundo real y **viaja con ella entre sistemas**. El examen adora esta distinción.
- **HumanName**: `use` (official, usual, nickname, maiden...), `family` (0..1 — **un solo apellido compuesto**, no lista), `given` (0..* — nombres y segundos nombres), `text`, `period`.
- **Address**: `use` (home/work/temp/old/billing), `type` (postal/physical/both), `line[]`, `city`, `district`, `state`, `postalCode`, `country`.
- **ContactPoint**: `system` (phone/fax/email/pager/url/sms/other), `value`, `use`, `rank` (1 = preferido).
- **Period**: `start` y `end`, ambos inclusivos; `end` ausente = vigente/en curso.
- **Quantity**: `value` + `unit` (texto humano) + `system` (UCUM: `http://unitsofmeasure.org`) + `code` (unidad computable UCUM). `comparator` (`<`, `<=`, `>=`, `>`) es **modificador**: "<5" no es lo mismo que "5". **SimpleQuantity** = Quantity con `comparator` prohibido (se usa donde un comparador no tendría sentido, como en dosis).
- **Range**: `low` y `high` (SimpleQuantity). **Ratio**: `numerator`/`denominator` (Quantity), típico en concentraciones (250 mg / 5 mL).
- **Annotation**: `author[x]`, `time`, `text` (markdown, obligatorio).
- **Attachment**: `contentType` (MIME), y el contenido **inline** (`data`, base64) o **por referencia** (`url`), más `size`, `hash`, `title`.

### Tipos especiales (metadatos y conceptos)

- **Coding**: un código de un sistema: `system` + `code` + `display` + `version` + `userSelected`.
- **CodeableConcept**: `coding[]` (cero o más Codings, potencialmente el mismo concepto en varios sistemas) + `text` libre. Es el tipo por defecto para conceptos clínicos.
- **Reference**: ver sección siguiente.
- La decisión `code` vs `Coding` vs `CodeableConcept` se profundiza en el Tema 6, pero regla rápida: `code` cuando el sistema está fijado por FHIR (status), `Coding` cuando hay exactamente un sistema (Encounter.class en R4), `CodeableConcept` cuando el mundo real es plural (diagnósticos).

### Choice types: value[x]

Un elemento `[x]` admite **exactamente un** tipo a la vez, y el nombre serializado concatena el tipo con mayúscula inicial: `Observation.value[x]` -> `valueQuantity`, `valueCodeableConcept`, `valueString`, `valueBoolean`... Reglas: nunca dos variantes a la vez, y los elementos choice tienen cardinalidad máxima 1 (no se repiten). `Condition.onset[x]`, `MedicationRequest.medication[x]` y `Patient.deceased[x]` funcionan igual.

## Referencias a fondo

`Reference` tiene cuatro campos relevantes: `reference` (URL literal), `type`, `identifier` (referencia lógica) y `display` (texto de cortesía, **nunca** fuente de verdad).

| Forma | Ejemplo | Cuándo |
|---|---|---|
| Literal relativa | `"reference": "Patient/123"` | Se resuelve contra la base del servidor donde vive el recurso. La más común |
| Literal absoluta | `"reference": "https://otro.servidor.sv/fhir/Patient/123"` | Referencias entre servidores |
| Versionada | `"reference": "Patient/123/_history/2"` | Cuando importa la versión exacta (documentos firmados) |
| Lógica (por identifier) | `"identifier": { "system": "https://fhir.gob.sv/id/dui", "value": "01234567-8" }` | Cuando no conoces la URL del recurso destino pero sí su identificador de negocio. El servidor **no está obligado** a resolverla |
| Interna a contained | `"reference": "#med1"` | Apunta a un recurso en `contained` del mismo recurso |
| URN en Bundle | `"reference": "urn:uuid:6b7f7e1a-..."` | Dentro de transactions, para enlazar entradas que aún no tienen id de servidor |

Resolución **dentro de un Bundle** (regla exacta de la especificación): primero se busca una entrada cuyo `fullUrl` coincida con la referencia; si la referencia es relativa, se resuelve contra el `fullUrl` de la entrada origen tratándolo como base. Si no hay coincidencia, la referencia apunta fuera del Bundle. Por eso `entry.fullUrl` no es decorativo: es la clave de resolución.

Cuándo `contained` sí y cuándo no: **sí** cuando el dato no tiene identidad independiente ni ciclo de vida propio; **no** cuando podrías necesitar buscarlo, versionarlo o referenciarlo desde otro recurso. Contener por pereza rompe la capacidad de búsqueda (los recursos contenidos no aparecen en búsquedas directas).

## Recursos clínicos nucleares

El examen pregunta por campos concretos. Memoriza estos:

### Patient
`identifier[]`, `active`, `name[]`, `telecom[]`, `gender` (administrativo: male/female/other/unknown), `birthDate`, `deceased[x]` (boolean o dateTime — **modificador**), `address[]`, `contact[]`, `communication[]`, `generalPractitioner`, `link` (para vincular registros duplicados; también modificador conceptual del registro).

### Encounter
`status` (planned -> arrived -> in-progress -> finished, y `cancelled`), `class` (**Coding**, no CodeableConcept, en R4 — binding a ActCode: AMB ambulatorio, IMP internamiento, EMER emergencia), `type`, `subject`, `participant[]`, `period`, `reasonCode`, `hospitalization`, `serviceProvider`.

### Observation
`status` (1..1: registered/preliminary/final/amended/corrected/cancelled/entered-in-error), `category` (vital-signs, laboratory...), `code` (1..1, qué se midió — típicamente LOINC), `subject`, `encounter`, `effective[x]` (cuándo aplica clínicamente), `issued`, `value[x]`, `dataAbsentReason`, `interpretation`, `referenceRange`, `component[]`.

**Presión arterial**: un solo Observation con `code` = LOINC `85354-9` (panel) y dos `component`, cada uno con su propio `code` y `valueQuantity`:

```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs" }] }],
  "code": { "coding": [{ "system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel" }] },
  "subject": { "reference": "Patient/123" },
  "effectiveDateTime": "2026-07-15T09:30:00-06:00",
  "component": [
    { "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6" }] },
      "valueQuantity": { "value": 120, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]" } },
    { "code": { "coding": [{ "system": "http://loinc.org", "code": "8462-4" }] },
      "valueQuantity": { "value": 80, "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]" } }
  ]
}
```

Invariante obs-6: `dataAbsentReason` solo puede estar presente si `value[x]` **no** está presente. Es la forma correcta de decir "se intentó medir y no se pudo".

### Condition
Dos CodeableConcepts modificadores que no debes confundir: `clinicalStatus` (estado clínico: active, recurrence, relapse, inactive, remission, resolved) y `verificationStatus` (estado epistémico: unconfirmed, provisional, differential, confirmed, refuted, entered-in-error). Un diagnóstico puede estar `active` + `provisional` (sospecha en curso) o `resolved` + `confirmed` (fue real y ya pasó). Además: `code` (SNOMED CT/ICD-10), `subject` (1..1), `encounter`, `onset[x]`, `abatement[x]`.

### MedicationRequest
`status` (1..1), `intent` (1..1: proposal/plan/order/original-order...), `medication[x]` — **choice**: `medicationCodeableConcept` (código de catálogo) o `medicationReference` (Reference a Medication, necesario para composiciones detalladas o magistrales, a menudo contained), `subject` (1..1), `authoredOn`, `requester`, `dosageInstruction[]` (tipo Dosage: `text`, `timing`, `route`, `doseAndRate`).

### DiagnosticReport, AllergyIntolerance, Procedure
- **DiagnosticReport**: `status`, `code` (qué informe), `result[]` -> **References a Observation** (los valores viven en Observations, el informe los agrupa), `conclusion`, `presentedForm` (PDF adjunto).
- **AllergyIntolerance**: `clinicalStatus`/`verificationStatus` (modificadores), `type` (allergy | intolerance), `category` (food/medication/environment/biologic), `criticality` (low/high/unable-to-assess), `code`, `patient` (1..1), `reaction[]` con `manifestation` y `severity`.
- **Procedure**: `status`, `code`, `subject` (1..1), `performed[x]`, `performer[]`, `outcome`.

Grafo típico de una consulta: `Encounter.subject -> Patient`; `Observation.subject -> Patient` y `Observation.encounter -> Encounter`; `Condition.subject/encounter` igual; `MedicationRequest.subject -> Patient`. Todo gravita hacia Patient.

## Bundle a fondo

Bundle hereda de Resource (no de DomainResource): sin narrativa, sin extensiones raíz. Su `type` (modificador) define las reglas:

| type | Semántica | Reglas clave |
|---|---|---|
| `searchset` | Resultado de búsqueda | `total`, `link` (self/next/previous), `entry.search.mode` = match/include |
| `transaction` | Operaciones **atómicas**: todo o nada | Cada entry lleva `request` (method + url). Si una falla, el servidor revierte todo y responde error |
| `batch` | Operaciones **independientes** | Cada entry se procesa por separado; unas pueden fallar y otras no. Las entradas no pueden depender entre sí |
| `transaction-response` / `batch-response` | Respuesta correspondiente | Cada entry lleva `response` (status, location, etag) |
| `document` | Documento clínico inmutable | Primera entry **obligatoriamente Composition**; requiere `identifier` y `timestamp` |
| `message` | Mensajería | Primera entry **obligatoriamente MessageHeader** |
| `collection` | Agrupación genérica | Sin semántica de procesamiento |
| `history` | Resultado de `_history` | Puede incluir entradas de borrado |

Orden de procesamiento de una **transaction** (pregunta clásica): primero todos los DELETE, luego los POST, luego PUT/PATCH, luego GET/HEAD. Las referencias `urn:uuid:` entre entradas se **reescriben** por el servidor con los ids reales asignados:

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    { "fullUrl": "urn:uuid:88f151c0-a954-468a-88bd-5ae15c08e059",
      "resource": { "resourceType": "Patient", "name": [{ "family": "Pérez", "given": ["Ana"] }] },
      "request": { "method": "POST", "url": "Patient" } },
    { "fullUrl": "urn:uuid:61ebe359-bfdc-4613-8bf2-c5e300945f0a",
      "resource": { "resourceType": "Observation", "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4" }] },
        "subject": { "reference": "urn:uuid:88f151c0-a954-468a-88bd-5ae15c08e059" } },
      "request": { "method": "POST", "url": "Observation" } }
  ]
}
```

`entry.request.ifNoneExist` habilita el **conditional create** ("crea solo si no existe un Patient con este identifier"), pieza esencial de cargas idempotentes.

## Errores comunes y gotchas

- **Confundir `id` con `Identifier`**: buscar `Patient?identifier=123` cuando querías `Patient/123` (o viceversa). El id lógico no es un identificador de negocio.
- **Ignorar una `modifierExtension` desconocida** y procesar el recurso igual. Respuesta correcta de examen: rechazar o tratar como excepción.
- **Tratar `transaction` como `batch`**: asumir que las entradas fallan de forma independiente. Transaction es atómico; batch no. Y en batch las entradas **no pueden** referenciarse entre sí con urn:uuid.
- **`display` como dato**: tomar `subject.display` como el nombre real del paciente en lugar de resolver la referencia.
- **Olvidar que `Encounter.class` es Coding** (no CodeableConcept) en R4 — cambia la forma del JSON. (En R5 pasó a CodeableConcept: ejemplo de por qué anclamos a versión).
- **`valueQuantity` y `dataAbsentReason` juntos**: viola obs-6. Uno u otro.
- **Cadena vacía o elemento vacío** (`"family": ""`): inválido en FHIR; si no hay dato, el elemento no se envía.
- **`dateTime` con hora sin zona horaria**: inválido.
- **Poner en `contained` recursos con identidad propia** y luego descubrir que no puedes buscarlos ni referenciarlos desde fuera.
- **Primera entry incorrecta**: document exige Composition; message exige MessageHeader.

## Nivel experto

- **JSON vs XML**: en JSON no existe el atributo `id` de elemento ni el orden garantizado de propiedades; las extensiones sobre primitivos usan `_propiedad`. Un mismo recurso debe hacer round-trip sin pérdida entre formatos.
- **`meta.profile` es una afirmación, no una garantía**: que un recurso declare un perfil no significa que lo cumpla; la conformidad se comprueba con `$validate` (Tema 7).
- **Referencias circulares y `Bundle` como grafo**: un searchset con `_include` es un grafo, no un árbol; procesa `entry[]` construyendo un índice `fullUrl -> resource` antes de resolver referencias, nunca con búsquedas lineales repetidas.
- **Inmutabilidad de documentos**: un Bundle `document` se persiste como un todo y se referencia por su `identifier`; regenerarlo produce otro documento (otro `timestamp`).
- **R5/R6 en el horizonte**: R5 introdujo tipos como `CodeableReference` (fusión de CodeableConcept y Reference, que en R4 obliga a pares `medicationCodeableConcept`/`medicationReference`) e hizo `Encounter.class` CodeableConcept. R6 avanza hacia estatus normativo de más recursos. El examen Foundational se rinde sobre **R4**, pero saber qué cambia te evita "aprender" contenido de blogs escritos sobre otra versión.
- **Diseño institucional**: en una red nacional, define desde el día uno los `system` URI de tus Identifiers (`https://fhir.gob.sv/id/dui`, `.../id/expediente`) y publícalos; la mitad de los problemas de deduplicación de pacientes nace de systems inconsistentes.

## Chuleta

| Concepto | Clave |
|---|---|
| Resource | id, meta, implicitRules (modificador), language |
| DomainResource | + text, contained, extension, modifierExtension |
| contained | Sin narrativa, sin anidación, sin versionId/lastUpdated, referenciado con `#id` |
| modifierExtension | No se puede ignorar: entender o rechazar |
| Identifier vs id | Negocio (system+value, portable) vs técnico (local al servidor) |
| Quantity | value + unit + system UCUM + code; comparator es modificador; SimpleQuantity lo prohíbe |
| value[x] | Un solo tipo a la vez; nombre = value + Tipo capitalizado |
| Reference | literal (relativa/absoluta/versionada), lógica (identifier), contained (#), urn:uuid en Bundle |
| Resolución en Bundle | reference se compara contra `entry.fullUrl` |
| Observation | status y code 1..1; component para presión arterial; obs-6: value[x] XOR dataAbsentReason |
| Condition | clinicalStatus (curso clínico) ≠ verificationStatus (certeza) |
| MedicationRequest | status + intent 1..1; medication[x] choice |
| Bundle transaction | Atómico; orden DELETE -> POST -> PUT -> GET; urn:uuid reescritos |
| Bundle document / message | Primera entry: Composition / MessageHeader |
| Compartimento | `Patient/123/$everything` |

## Autoevaluación

1. ¿Qué cuatro elementos aporta Resource y cuáles añade DomainResource?
2. Un sistema recibe un MedicationRequest con una modifierExtension que no reconoce. ¿Qué debe hacer y por qué?
3. ¿Por qué `Bundle` no puede llevar extensiones en su raíz?
4. Escribe la referencia lógica a un paciente con DUI 01234567-8 emitido por `https://fhir.gob.sv/id/dui`.
5. ¿Cómo se modela una presión arterial 120/80 en un solo Observation y qué códigos LOINC usan panel, sistólica y diastólica?
6. En una transaction, ¿en qué orden procesa el servidor los métodos HTTP y qué pasa con las referencias `urn:uuid:`?
7. ¿Qué combinación de `clinicalStatus` y `verificationStatus` describe una sospecha diagnóstica aún en estudio?
8. ¿Cuáles son las tres condiciones que hacen inválido un recurso `contained`?

### Respuestas

1. Resource: `id`, `meta`, `implicitRules`, `language`. DomainResource añade `text`, `contained`, `extension`, `modifierExtension`.
2. No procesarlo como si la extensión no existiera: debe rechazarlo o escalarlo como excepción, porque una modifierExtension cambia el significado del recurso (p. ej., podría negar la prescripción).
3. Porque Bundle hereda directamente de Resource, no de DomainResource, y `extension`/`modifierExtension`/`text` se definen en DomainResource.
4. `"subject": { "identifier": { "system": "https://fhir.gob.sv/id/dui", "value": "01234567-8" } }` — sin campo `reference`.
5. Observation con `code` = LOINC 85354-9 y dos `component`: 8480-6 (sistólica) y 8462-4 (diastólica), cada uno con su `valueQuantity` en mm[Hg].
6. DELETE, luego POST, luego PUT/PATCH, luego GET/HEAD. El servidor reescribe las referencias urn:uuid con los ids reales asignados a las entradas creadas.
7. `clinicalStatus` = active y `verificationStatus` = provisional (o differential si se baraja entre varias).
8. Tener narrativa propia, anidar otro contained, no ser referenciado desde el contenedor; además no puede llevar meta.versionId/lastUpdated.

## Para profundizar

- [Lista de recursos R4](http://hl7.org/fhir/R4/resourcelist.html) — el mapa completo, organizado por niveles de madurez.
- [DomainResource](http://hl7.org/fhir/R4/domainresource.html) — elementos comunes e invariantes dom-1..dom-6.
- [Tipos de datos R4](http://hl7.org/fhir/R4/datatypes.html) — la referencia exacta de cada primitivo y tipo general.
- [References](http://hl7.org/fhir/R4/references.html) — reglas de resolución, referencias lógicas y contained.
- [Bundle](http://hl7.org/fhir/R4/bundle.html) — tipos, fullUrl, procesamiento de transactions y resolución interna.
- [Extensibility](http://hl7.org/fhir/R4/extensibility.html) — extensiones simples, complejas y modificadoras.
