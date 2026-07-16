# Terminologías clínicas

> **En simple:** dos sistemas pueden intercambiar JSON perfecto y aun así no entenderse si "infarto" se codifica distinto en cada uno. La terminología es la capa que da **significado** compartido: sistemas de códigos (LOINC, SNOMED CT, UCUM), conjuntos de valores (ValueSet), mapas entre catálogos (ConceptMap), fuerzas de binding y las operaciones ($lookup, $expand, $validate-code, $translate) que un servidor de terminología expone. Sin esto no hay interoperabilidad semántica, solo sintáctica.

## El problema: interoperabilidad semántica

La interoperabilidad **sintáctica** (JSON válido, REST correcto) es la parte fácil. El problema duro es **semántico**: que "glucosa en ayunas" registrada en un hospital de Santa Ana sea computable como la misma prueba en San Salvador. FHIR lo resuelve separando tres preguntas:

1. **¿Qué códigos existen y qué significan?** -> CodeSystem (LOINC, SNOMED CT, o tu catálogo nacional).
2. **¿Cuáles de esos códigos son válidos en este campo?** -> ValueSet (un subconjunto con propósito).
3. **¿Cómo traduzco entre catálogos?** -> ConceptMap.

Y define cómo un elemento se ata a un ValueSet: el **binding**, con una fuerza que determina qué tan negociable es.

### code vs Coding vs CodeableConcept vs Quantity.code

La tabla decisiva (memorízala; el examen la explota):

| Tipo | Estructura | Cuándo | Ejemplo |
|---|---|---|---|
| `code` | String pelado | El sistema está **fijado por la especificación**; solo viaja el código | `"status": "final"` |
| `Coding` | system + code + display (+version, userSelected) | Un solo código de un solo sistema, sin texto alternativo | `Encounter.class` (R4), `meta.tag` |
| `CodeableConcept` | `coding[]` + `text` | El caso general clínico: puede haber varios codings (el mismo concepto en SNOMED **y** en el catálogo local) y texto libre | `Condition.code`, `Observation.code` |
| `Quantity.code` | code dentro de Quantity | La unidad computable, casi siempre UCUM | `"code": "mm[Hg]"` |

```json
"code": {
  "coding": [
    { "system": "http://snomed.info/sct", "code": "38341003", "display": "Hypertensive disorder" },
    { "system": "https://fhir.gob.sv/CodeSystem/diagnosticos-minsal", "code": "HTA-01" }
  ],
  "text": "Hipertensión arterial"
}
```

Dos codings en un CodeableConcept **deben representar el mismo concepto** (traducciones entre sistemas), no conceptos distintos. `text` captura lo que el usuario vio/escribió; nunca lo descartes al transformar.

## Los grandes sistemas de códigos

| Sistema | URI canónica | Rol |
|---|---|---|
| LOINC | `http://loinc.org` | **Qué se midió**: laboratorio, signos vitales, documentos. Licencia libre |
| SNOMED CT | `http://snomed.info/sct` | **Significado clínico**: diagnósticos, hallazgos, procedimientos. Licencia por país (afiliación IHTSDO/SNOMED International) |
| ICD-10 / ICD-11 | `http://hl7.org/fhir/sid/icd-10` | Clasificación **administrativa y epidemiológica**: reportes, facturación, mortalidad |
| UCUM | `http://unitsofmeasure.org` | Unidades de medida computables (`mg`, `mm[Hg]`, `10*3/uL`) |
| RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` | Medicamentos (EE. UU.); alternativa internacional: ATC (`http://www.whocc.no/atc`) |

- **LOINC**: cada código identifica una prueba definida por **seis partes** (Component, Property, Time, System/espécimen, Scale, Method). `8867-4` = frecuencia cardíaca; `4548-4` = HbA1c. Si dos pruebas difieren en el espécimen o el método, tienen códigos distintos: esa granularidad es la gracia.
- **SNOMED CT**: ontología con **jerarquías de subsunción** (un `Infarto agudo de miocardio` ES-UN `Cardiopatía isquémica`) y relaciones definitorias. Permite consultas expresivas con **ECL** (Expression Constraint Language), p. ej. "todos los descendientes de 73211009 |Diabetes mellitus|" — la base del modificador `:below` y de los filtros `is-a` en ValueSets.
- **ICD-10**: no compite con SNOMED; conviven — SNOMED para registrar con precisión clínica, ICD para agregar y reportar (el mapeo SNOMED->ICD es un ConceptMap clásico).

## CodeSystem, ValueSet y ConceptMap

Los tres recursos de conocimiento terminológico, en orden de dependencia.

### CodeSystem a fondo

Un `CodeSystem` declara la existencia y significado de códigos. Elementos que caen en examen:

- `url` (canónica) + `version`: identifican el sistema. Comparar códigos requiere mismo `system` (y a veces versión).
- **`content`**: cuánto del sistema contiene este recurso: `complete` (todos los conceptos), `fragment` (subconjunto ilustrativo), `not-present` (solo metadatos: así se representa SNOMED en un servidor — los conceptos viven en el servidor de terminología, no en el recurso), `example`, `supplement` (añade designaciones/propiedades a otro CodeSystem).
- `concept[]`: código, display, definition, `concept` anidado (jerarquía) y `property[]` (atributos como estado, orden, clase).
- `caseSensitive`, `hierarchyMeaning`, `valueSet` (el "ValueSet de todo el sistema").

```json
{
  "resourceType": "CodeSystem",
  "url": "https://fhir.gob.sv/CodeSystem/establecimientos-tipo",
  "version": "1.0.0",
  "status": "active",
  "content": "complete",
  "caseSensitive": true,
  "concept": [
    { "code": "H", "display": "Hospital",
      "concept": [{ "code": "H-N", "display": "Hospital nacional" }] },
    { "code": "UCSF", "display": "Unidad comunitaria de salud familiar" }
  ]
}
```

### ValueSet: composición y expansión

Un `ValueSet` selecciona códigos **de uno o más CodeSystems** para un propósito. Tiene dos caras:

1. **`compose`** (la definición intensional): `include`/`exclude` por sistema, con tres mecanismos combinables — enumerar `concept[]` concretos, aplicar `filter[]` (p. ej. `property=concept, op=is-a, value=73211009` para "diabetes y descendientes" en SNOMED), o importar otros ValueSets (`valueSet`).
2. **`expansion`** (la cara extensional): la **lista materializada** de códigos resultante de evaluar el compose en un momento dado, producida por `$expand`.

Punto de examen: **la expansión puede cambiar con el tiempo sin que cambie el ValueSet**, porque los CodeSystems subyacentes evolucionan (SNOMED publica ediciones; un filtro `is-a` captura conceptos nuevos automáticamente). Por eso las expansiones llevan `timestamp` e `identifier`, y por eso los contextos regulatorios fijan **versiones**: `compose.include.version`, o canónicas con versión (`http://ejemplo|1.2.0`).

### ConceptMap: traducir entre catálogos

Un `ConceptMap` relaciona códigos de un sistema origen con uno destino, agrupados por par de sistemas (`group.source`/`group.target`):

```json
{
  "resourceType": "ConceptMap",
  "url": "https://fhir.gob.sv/ConceptMap/diagnosticos-minsal-a-snomed",
  "status": "active",
  "group": [{
    "source": "https://fhir.gob.sv/CodeSystem/diagnosticos-minsal",
    "target": "http://snomed.info/sct",
    "element": [{
      "code": "HTA-01",
      "target": [{ "code": "38341003", "display": "Hypertensive disorder", "equivalence": "equivalent" }]
    }]
  }]
}
```

La **`equivalence`** (R4) califica cada correspondencia: `relatedto`, `equivalent`, `equal`, `wider` (el destino es más amplio), `subsumes`, `narrower` (más específico; exige comentario), `specializes`, `inexact`, `unmatched`, `disjoint`. En R5 se renombró a `relationship` con valores simplificados. Entender `wider`/`narrower` importa: mapear tu código local a uno más amplio pierde información **irrecuperable** en la ida y vuelta.

## Bindings: la fuerza del contrato

Un binding ata un elemento codificado a un ValueSet con una **strength**:

| Fuerza | Significado EXACTO | Consecuencia |
|---|---|---|
| `required` | El código DEBE venir del ValueSet | Código fuera del conjunto = recurso inválido |
| `extensible` | DEBE usarse un código del conjunto **si existe uno aplicable al concepto**; solo si el concepto no está cubierto puedes usar otro código (o solo texto) | El matiz de examen: no es "úsalo si quieres"; es "sal del conjunto únicamente cuando el concepto real no esté" |
| `preferred` | Se RECOMIENDA el conjunto, no es obligatorio | Interoperabilidad mejor si lo sigues |
| `example` | El conjunto solo ilustra | Sin expectativa de conformidad |

Orden de rigidez: **required > extensible > preferred > example**. Nota fina sobre `extensible`: si el concepto está en el ValueSet pero con un código que tu interfaz no muestra, no puedes "escapar" con otro catálogo — eso viola el binding. Los perfiles (Tema 7) pueden **endurecer** un binding heredado (example -> extensible -> required), nunca relajarlo.

## Operaciones y servidores de terminología

Las cuatro que debes saber ejecutar (más una), con sus URLs reales:

### $lookup — ¿qué significa este código?
```http
GET [base]/CodeSystem/$lookup?system=http://loinc.org&code=8867-4
```
Respuesta: `Parameters` con `name`, `display` ("Heart rate"), `designation[]`, `property[]`.

### $validate-code — ¿es válido este código aquí?
```http
GET [base]/ValueSet/$validate-code?url=http://hl7.org/fhir/ValueSet/observation-status&system=http://hl7.org/fhir/observation-status&code=final
```
Respuesta: `Parameters` con `result` (boolean), `message` y `display`. Es lo que un validador ejecuta por dentro para cada binding required/extensible.

### $expand — dame la lista (y el typeahead)
```http
GET [base]/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender
GET [base]/ValueSet/$expand?url=...&filter=hiperten&count=10
```
Respuesta: el ValueSet con `expansion.contains[]`. Con `filter` implementa el **autocompletado clínico**: el usuario teclea "hiperten" y el servidor devuelve los 10 primeros conceptos que matchean — patrón universal de formularios clínicos.

### $translate — cruza el ConceptMap
```http
GET [base]/ConceptMap/$translate?url=https://fhir.gob.sv/ConceptMap/diagnosticos-minsal-a-snomed&system=https://fhir.gob.sv/CodeSystem/diagnosticos-minsal&code=HTA-01
```
Respuesta: `Parameters` con `result` y `match[]` (equivalence + concept destino).

### $subsumes — ¿A es ancestro de B?
```http
GET [base]/CodeSystem/$subsumes?system=http://snomed.info/sct&codeA=73211009&codeB=44054006
```
Respuesta: `outcome` = `subsumes` | `subsumed-by` | `equivalent` | `not-subsumed`. (Diabetes subsume diabetes tipo 2.)

### Servidores de terminología

Ningún servidor FHIR clínico carga SNOMED entero "dentro" de sus recursos: delega en un **servidor de terminología** que implementa las operaciones anteriores. Piezas del ecosistema:

- **tx.fhir.org** — el servidor de referencia de HL7 (el que usa el validador oficial por defecto).
- **terminology.hl7.org (THO)** — la publicación de los CodeSystems/ValueSets propios de HL7 (los `http://terminology.hl7.org/CodeSystem/...` que ves en category, tags, v2/v3).
- **VSAC** (NLM, EE. UU.) — repositorio de value sets regulatorios; su equivalente conceptual existe en cada jurisdicción.
- **Servidor institucional**: en una red nacional montas el tuyo (Snowstorm para SNOMED, HAPI, Ontoserver) con: los CodeSystems nacionales, los ValueSets normativos, los ConceptMaps de catálogos legados, y versionado gobernado. Las aplicaciones consultan `$expand`/`$validate-code` a ese servidor: la terminología se **centraliza**, no se copia en cada app.

#### Mini-caso El Salvador

El laboratorio del hospital X reporta "GLU-AY" (catálogo propio) y el hospital Y "LAB-0042". Estrategia nacional: (1) publicar cada catálogo legado como CodeSystem con URL canónica del dominio nacional; (2) definir el ValueSet nacional de pruebas de laboratorio **sobre LOINC**; (3) crear ConceptMaps `catalogo-X -> LOINC` y `catalogo-Y -> LOINC` con equivalences honestas (marcar `narrower`/`wider` donde el catálogo local es menos preciso); (4) en la interfaz de integración, `$translate` cada resultado entrante y almacenar **ambos** codings en el CodeableConcept (el local en su system + el LOINC). Así no se pierde el dato origen y todo consumidor nacional computa sobre LOINC.

## Errores comunes y gotchas

- **Coding sin `system`**: `{"code": "38341003"}` no significa nada; el código solo existe dentro de su sistema. Es el error número uno en integraciones.
- **System equivocado o inventado**: `"system": "SNOMED"` o `"snomed-ct"` en lugar de `http://snomed.info/sct`. Los systems son URIs exactas, sensibles a mayúsculas.
- **Dos conceptos distintos en un CodeableConcept**: los codings de un mismo CodeableConcept deben ser el mismo concepto en distintos sistemas, no "hipertensión y diabetes juntas".
- **Confundir CodeSystem con ValueSet**: el CodeSystem define códigos; el ValueSet los selecciona. "El ValueSet de género no define male; lo incluye".
- **Leer `extensible` como opcional**: si el concepto está cubierto por el conjunto, estás obligado a usar su código. Solo conceptos no cubiertos justifican salirse.
- **Asumir expansiones estables**: un `$expand` de hoy puede diferir del de mañana si el CodeSystem publicó versión nueva; fija versiones cuando la reproducibilidad importe.
- **Comparar códigos por display**: el display es informativo y puede variar por idioma/edición; la identidad es system+code (+version cuando el sistema no garantiza permanencia de significado).
- **Usar `text` como si fuera un coding**: `text` sin coding es legal (según binding) pero no computable; los indicadores nacionales no se calculan sobre texto libre.
- **Olvidar la licencia de SNOMED**: usarlo en producción requiere que el país sea miembro o licencia; LOINC y UCUM son de uso libre.
- **Mapear con `equivalent` todo**: un ConceptMap honesto declara `narrower`/`wider`; mapeos "todo equivalente" fabricados a prisa corrompen datos silenciosamente.

## Nivel experto

- **Versionado de SNOMED por edición**: el `version` de SNOMED es una URI con módulo y fecha (p. ej. `http://snomed.info/sct/449081005/version/20240131` para la edición internacional en español). Un servidor puede alojar varias ediciones; `$expand` acepta `system-version` para fijarla.
- **ECL en ValueSets**: además del filtro `is-a`, los servidores que soportan SNOMED aceptan filtros con `constraint` ECL (`<< 73211009 |Diabetes|`), lo que convierte al ValueSet en una consulta ontológica viva.
- **CodeSystem supplements**: para añadir displays en español a LOINC sin tocar LOINC, publicas un CodeSystem `content: supplement` con `supplements: http://loinc.org` y designations `es-SV`. Los `$lookup` con `displayLanguage` las devuelven.
- **Implicit ValueSets**: algunos sistemas definen ValueSets implícitos por URL (p. ej. `http://snomed.info/sct?fhir_vs=isa/73211009`), expandibles sin declarar recurso alguno.
- **Rendimiento**: `$validate-code` en el hot path de escritura de un hospital exige caché local de expansiones para bindings required pequeños, y llamada remota solo para SNOMED/LOINC. Diseña el timeout y el fallback (¿rechazas o aceptas con warning si el tx-server no responde?) — decisión de gobernanza, no técnica.
- **R5/R6**: ConceptMap.relationship reemplaza equivalence; aparece el recurso auxiliar `TerminologyCapabilities` para declarar qué soporta un servidor de terminología. Los conceptos centrales no cambian.

## Chuleta

| Concepto | Clave |
|---|---|
| code / Coding / CodeableConcept | Sistema fijado por spec / un código de un sistema / varios codings + text (caso general) |
| URIs canónicas | LOINC `http://loinc.org` · SNOMED `http://snomed.info/sct` · UCUM `http://unitsofmeasure.org` · ICD-10 `http://hl7.org/fhir/sid/icd-10` |
| CodeSystem.content | complete / fragment / not-present (SNOMED en servidor) / example / supplement |
| ValueSet | compose (include/exclude, concept, filter is-a, valueSet) vs expansion (materializada, con timestamp; puede cambiar con el tiempo) |
| ConceptMap.equivalence | equivalent, wider, narrower (pierde info), unmatched, inexact... por group source->target |
| Bindings | required > extensible > preferred > example; extensible = obligatorio si el concepto está cubierto |
| $lookup | Detalles de un código (display, propiedades) |
| $validate-code | ¿Código válido en este ValueSet? -> result boolean |
| $expand | Materializa el ValueSet; `filter` + `count` = typeahead |
| $translate | Cruza un ConceptMap -> match[] con equivalence |
| $subsumes | Relación jerárquica entre codeA y codeB |
| Servidores | tx.fhir.org (referencia), terminology.hl7.org (códigos HL7), servidor institucional centralizado |
| Estrategia nacional | CodeSystem local publicado + ValueSet sobre LOINC/SNOMED + ConceptMap + guardar ambos codings |

## Autoevaluación

1. ¿Por qué `Observation.status` es un `code` pero `Observation.code` es un `CodeableConcept`?
2. Un colega pone en un mismo CodeableConcept un coding de hipertensión y otro de diabetes "para ahorrar espacio". ¿Qué está mal?
3. Explica la diferencia entre `compose` y `expansion` de un ValueSet, y por qué la expansión de hoy puede no ser la de mañana.
4. Un elemento tiene binding `extensible` a un ValueSet que SÍ contiene el concepto que necesitas, pero prefieres tu código local. ¿Puedes usarlo solo? ¿Qué harías bien?
5. Escribe la llamada `$expand` para un autocompletado que busque "hiperten" con máximo 10 resultados en un ValueSet dado.
6. ¿Qué `equivalence` declaras si tu código local "dolor abdominal agudo" se mapea a un SNOMED "dolor abdominal" y qué riesgo implica?
7. ¿Qué significa `content: not-present` en un CodeSystem y cuándo lo verás?
8. Diseña en 4 pasos la estrategia para integrar el catálogo de laboratorio legado de un hospital a la red nacional.

### Respuestas

1. El sistema de `status` está fijado por la especificación (solo puede venir de ese conjunto required), así que basta el código pelado. `Observation.code` representa conceptos del mundo clínico plural: necesita system+code (posiblemente varios) y texto.
2. Los codings de un CodeableConcept deben representar **el mismo concepto** en sistemas distintos. Dos diagnósticos son dos Conditions (o dos CodeableConcepts), no dos codings.
3. `compose` es la definición (reglas: include/exclude/filter); `expansion` es la lista materializada al evaluarla contra versiones concretas de los CodeSystems. Si el CodeSystem publica una versión nueva, un filtro `is-a` puede capturar códigos nuevos: misma definición, expansión distinta.
4. Solo no: extensible obliga a usar el código del conjunto cuando el concepto está cubierto. Correcto: usar el código del ValueSet y, si quieres conservar el local, añadirlo como coding adicional del mismo CodeableConcept.
5. `GET [base]/ValueSet/$expand?url={canonica-del-valueset}&filter=hiperten&count=10`.
6. `wider` (el destino es más amplio que el origen). Riesgo: pérdida de especificidad irrecuperable si descartas el código local; por eso se almacenan ambos codings.
7. Que el recurso CodeSystem solo lleva metadatos y los conceptos no están enumerados dentro; típico de sistemas enormes o licenciados (SNOMED CT) cuyo contenido vive en el servidor de terminología.
8. (1) Publicar el catálogo como CodeSystem con canónica nacional; (2) definir el ValueSet nacional sobre LOINC; (3) construir el ConceptMap local->LOINC con equivalences honestas; (4) traducir con $translate en la interfaz y persistir ambos codings en el CodeableConcept.

## Para profundizar

- [Using Codes (terminologies) R4](http://hl7.org/fhir/R4/terminologies.html) — bindings, strengths y uso de códigos en recursos.
- [CodeSystem R4](http://hl7.org/fhir/R4/codesystem.html) — content, conceptos, propiedades, supplements.
- [ValueSet R4](http://hl7.org/fhir/R4/valueset.html) — compose, filtros y expansión.
- [ConceptMap R4](http://hl7.org/fhir/R4/conceptmap.html) — groups, equivalence y $translate.
- [Terminología de HL7 (THO)](https://terminology.hl7.org/) — los CodeSystems/ValueSets propios de HL7.
- [tx.fhir.org](https://tx.fhir.org) — el servidor de terminología de referencia.
- [LOINC](https://loinc.org) y [SNOMED International](https://www.snomed.org) — los dos pilares clínicos.
