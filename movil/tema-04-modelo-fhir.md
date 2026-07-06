# 📱 Tema 4 · El modelo FHIR: recursos, referencias y Bundles

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Identificar los recursos clínicos más comunes (Patient, Encounter, Observation, Condition, MedicationRequest) y cuándo usar cada uno.
- Entender los tipos de datos de FHIR R4: Identifier, HumanName, CodeableConcept, Reference, Period, Quantity.
- Leer cardinalidades (0..1, 1..1, 0..*) y saber qué es obligatorio y qué es repetible.
- Enlazar recursos entre sí con Reference (literal y lógica) y recorrer esas relaciones.
- Distinguir los tipos de Bundle (searchset, transaction, batch, document, collection) y recorrer su `entry`.
- Mapear un caso de uso real de DoctorSV a un grafo de recursos FHIR.

## Lectura

### FHIR piensa en piezas de Lego, no en un expediente gigante

En muchos sistemas legados, "el expediente del paciente" es un solo bloque enorme. FHIR hace lo contrario: descompone la realidad clínica en **recursos** pequeños y autocontenidos que se conectan entre sí. Cada recurso tiene un tipo (`resourceType`), un `id` asignado por el servidor, y una URL propia: `[base]/Patient/123`.

Los recursos que más vas a ver:

- **Patient**: la persona atendida (demografía: nombre, sexo, fecha de nacimiento).
- **Practitioner**: el profesional de salud.
- **Organization**: hospital, clínica, aseguradora.
- **Encounter**: una atención concreta (consulta, ingreso, emergencia).
- **Condition**: un diagnóstico o problema de salud.
- **Observation**: una medición o hallazgo (signos vitales, laboratorio).
- **MedicationRequest**: una prescripción.

Analogía: Patient es el sustantivo central y los demás recursos son oraciones que hablan de él. Casi todos apuntan al paciente mediante un campo `subject` o `patient`.

### Referencias: el pegamento del modelo

Una **Reference** es cómo un recurso apunta a otro. La forma más común es la referencia literal relativa:

```json
{
  "resourceType": "Observation",
  "status": "final",
  "subject": { "reference": "Patient/123", "display": "Ana Pérez" }
}
```

Detalles que caen en el examen:

- La referencia puede ser **relativa** (`Patient/123`), **absoluta** (`https://servidor.com/fhir/Patient/123`) o **lógica** (por `identifier`, cuando no conoces la URL del recurso: `"identifier": { "system": "...", "value": "DUI-123" }`).
- `display` es solo texto de cortesía para humanos; nunca lo uses como fuente de verdad.
- Dentro de un Bundle, las entradas se referencian entre sí por su `fullUrl` (incluyendo URNs como `urn:uuid:...` en transactions).

El grafo típico de una consulta: `Encounter.subject → Patient`, `Condition.subject → Patient` y `Condition.encounter → Encounter`, `Observation.subject → Patient` y `Observation.encounter → Encounter`. Error común: meter todo en un solo recurso u olvidar enlazar Observation/Condition con su Encounter.

### Tipos de datos: los átomos de FHIR

Los recursos se construyen con tipos de datos reutilizables. Los imprescindibles:

- **Identifier**: identificador de negocio (DUI, número de expediente). Tiene `system` (quién emite) + `value`. No lo confundas con el `id` técnico del servidor: el `id` puede cambiar entre servidores; el Identifier viaja con el paciente.
- **HumanName**: `use` (official, nickname...), `family` (apellido, uno solo en R4), `given` (lista de nombres). Ejemplo: `{ "family": "Pérez", "given": ["Ana", "María"] }`.
- **CodeableConcept**: concepto codificado; contiene una lista `coding` (cada uno con `system`, `code`, `display`) más un `text` libre. Es EL tipo para diagnósticos, tipos de encuentro, códigos de laboratorio.
- **Reference**: apuntador a otro recurso (visto arriba).
- **Period**: intervalo con `start` y `end` (fechas ISO 8601). Un Encounter usa `period` para decir cuándo ocurrió.
- **Quantity**: valor numérico con unidad: `{ "value": 72, "unit": "latidos/min", "system": "http://unitsofmeasure.org", "code": "/min" }`. La unidad codificada debe ser UCUM.

### Cardinalidad: qué es obligatorio y qué se repite

Cada elemento declara mínimo..máximo:

- `0..1`: opcional, máximo uno (`Patient.birthDate`).
- `1..1`: obligatorio, exactamente uno (`Observation.status`).
- `0..*`: opcional y repetible (`Patient.name`, `Patient.identifier`).
- `1..*`: al menos uno.

El estándar base es deliberadamente laxo (casi todo es 0..); son los **profiles** (Tema 7) los que endurecen cardinalidades. Aun así, hay obligatorios base famosos: `Observation.status` y `Observation.code` son 1..1 — olvidarlos es el error de validación más típico.

### Bundle: la caja que agrupa recursos

Un **Bundle** es un recurso contenedor. Su campo `type` define el comportamiento:

- **searchset**: resultado de una búsqueda (trae `total` y `link` de paginación).
- **transaction**: varias operaciones que el servidor procesa **atómicamente** (todo o nada); cada entry lleva `request` con method y url.
- **batch**: varias operaciones **independientes** (una puede fallar sin afectar a las demás).
- **document**: documento clínico; la primera entry SIEMPRE es una Composition.
- **collection**: colección genérica sin semántica de procesamiento.
- **history**: resultado de `_history`.

Recorrer un Bundle = iterar el array `entry`; cada entrada tiene `resource` (el recurso en sí) y opcionalmente `fullUrl`, `search`, `request` o `response` según el tipo. En un searchset, `entry.search.mode` distingue `match` (coincide con la búsqueda) de `include` (vino por `_include`).

### Caso DoctorSV, mapeado

"Un paciente llega a consulta, el médico registra presión arterial, diagnostica hipertensión y receta un medicamento":

- Patient (el paciente) + Practitioner (el médico) + Encounter (la consulta).
- Observation con código LOINC de presión arterial, `subject` → Patient, `encounter` → Encounter.
- Condition con código SNOMED/ICD-10 de hipertensión, mismas referencias.
- MedicationRequest con la receta, `subject` → Patient.

Si puedes hacer este mapeo de memoria con las flechas correctas, dominas el tema.

## Chuleta

| Concepto | Clave |
|---|---|
| Recurso | Unidad con `resourceType` + `id`; URL propia `[base]/Tipo/id` |
| Reference | `{ "reference": "Patient/123" }`; relativa, absoluta o por identifier |
| Identifier vs id | Identifier = negocio (DUI); id = técnico del servidor |
| CodeableConcept | `coding[]` (system+code+display) + `text` |
| Quantity | value + unit + system UCUM + code |
| Cardinalidad | min..max; `Observation.status` y `.code` son 1..1 |
| Bundle types | searchset, transaction (atómico), batch (independiente), document (inicia con Composition), collection, history |
| Recorrer Bundle | iterar `entry[]` → `entry.resource` |
| Grafo consulta | Encounter/Observation/Condition → subject → Patient |

## Autoevaluación (sin mirar arriba)

1. ¿Cuál es la diferencia entre el `id` de un recurso y un `Identifier`?
2. ¿Qué diferencia a un Bundle `transaction` de un `batch`?
3. Escribe (mentalmente) el JSON mínimo de una Reference de una Observation hacia el paciente 45.
4. ¿Qué dos elementos de Observation son obligatorios (1..1) en el estándar base?
5. En un Bundle `document`, ¿qué recurso debe ser la primera entry?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 4 Modelo FHIR".
2. Añade estos enlaces oficiales como fuentes:
   - http://hl7.org/fhir/R4/resourcelist.html — lista completa de recursos R4, para ubicar cualquier recurso que aparezca.
   - http://hl7.org/fhir/R4/datatypes.html — definición formal de Identifier, HumanName, CodeableConcept, Quantity, Period.
   - http://hl7.org/fhir/R4/bundle.html — tipos de Bundle y reglas de procesamiento.
   - http://hl7.org/fhir/overview.html — introducción oficial que da contexto al modelo de recursos.
3. Prompts sugeridos:
   - "Hazme 10 preguntas tipo examen sobre tipos de Bundle y cardinalidad, y corrige mis respuestas."
   - "Explícame con un ejemplo JSON completo cómo Encounter, Observation y Condition se enlazan a un Patient."
   - "Compara Identifier vs id y Reference literal vs lógica; dame casos donde elegir mal causa bugs."

---

### Respuestas

1. `id` es el identificador técnico que asigna el servidor (puede cambiar entre servidores); `Identifier` es un identificador de negocio con `system` + `value` (DUI, expediente) que viaja con el paciente.
2. `transaction` es atómico: si una operación falla, todo se revierte. `batch` procesa cada entrada de forma independiente.
3. `"subject": { "reference": "Patient/45" }`.
4. `Observation.status` y `Observation.code`.
5. Una Composition.
