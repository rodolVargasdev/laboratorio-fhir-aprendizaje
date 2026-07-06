# Tema 7 · Validación y Profiles

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Explicar por qué "JSON válido" no implica "recurso FHIR válido".
- Invocar $validate (con y sin profile) y leer la respuesta correctamente.
- Descomponer un OperationOutcome.issue: severity, code, diagnostics, location/expression.
- Explicar qué es un profile y las piezas de una StructureDefinition (url, type, baseDefinition, differential, snapshot).
- Entender slicing básico y must-support, con US Core como ejemplo canónico.
- Depurar un 422 y distinguirlo de un 200 con issues.

## Lectura

### JSON válido ≠ FHIR válido

Un recurso puede parsear perfectamente como JSON y aun así ser FHIR inválido: falta un elemento obligatorio, un código fuera del binding required, un tipo de dato incorrecto, una referencia rota. La validación tiene capas:

1. **Sintaxis**: ¿es JSON/XML bien formado?
2. **Estructura**: ¿los elementos existen en el recurso y tienen el tipo correcto?
3. **Cardinalidad**: ¿están los 1..1 y no se repite lo que no debe?
4. **Terminología**: ¿los códigos cumplen los bindings?
5. **Invariantes**: reglas expresadas en FHIRPath (ej: "Observation debe tener value o dataAbsentReason").
6. **Profile**: todo lo anterior, pero contra restricciones adicionales.

### La operación $validate

Envías el recurso en el cuerpo y el servidor lo revisa SIN guardarlo:

```
POST [base]/Patient/$validate
Content-Type: application/fhir+json
```

Para validar contra un profile concreto:

```
POST [base]/Patient/$validate?profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

Trampa clásica: $validate suele responder **HTTP 200 aunque el recurso sea inválido** — el 200 significa "validación ejecutada". El veredicto real está en el cuerpo: un OperationOutcome. Mira si hay issues con severity `error` o `fatal`.

Distinto es cuando haces un POST/PUT normal y el servidor rechaza el recurso: ahí recibes **422 Unprocessable Entity** (u otro 4xx), normalmente con un OperationOutcome en el cuerpo explicando por qué.

### OperationOutcome: el informe del profesor

Es el recurso estándar para comunicar errores y advertencias. Analogía: la tarea devuelta con correcciones en rojo.

```json
{
 "resourceType": "OperationOutcome",
 "issue": [{
  "severity": "error",
  "code": "required",
  "diagnostics": "Patient.name: minimum required = 1, but only found 0",
  "expression": ["Patient.name"]
 }]
}
```

Cada `issue` trae:

- **severity**: `fatal` (no se pudo ni procesar) | `error` (inválido) | `warning` (sospechoso pero aceptado) | `information` (dato).
- **code**: tipo de problema, de un ValueSet required: `required` (falta obligatorio), `invalid`, `structure`, `value`, `not-found`, `code-invalid`...
- **diagnostics**: mensaje legible — tu mejor amigo para depurar.
- **location** (rutas XPath-ish, estilo antiguo) y **expression** (ruta FHIRPath, ej. `Patient.name` — la forma moderna): dónde está el problema.

Flujo de depuración: filtra issues por severity error/fatal → lee expression/location para ubicar el elemento → usa diagnostics para entender la regla violada → corrige → revalida.

### Profiles: el estándar base es un molde genérico

FHIR R4 base es deliberadamente laxo (casi todo opcional) para servir a todo el mundo. Cada país, proyecto o guía de implementación (IG) lo **restringe** para su caso de uso: "nuestro Patient DEBE tener identifier, name y gender". Eso es un **profile**.

Analogía: el estándar base es la masa de galleta; el profile es el cortador con la forma exacta de tu receta (US Core, IPS...).

Importante: un profile solo puede **restringir**, nunca relajar el base (no puede volver opcional lo que el base exige). Para agregar información nueva están las **extensions**, y el profile define cuáles se permiten o exigen.

### StructureDefinition: el profile como recurso

Un profile ES un recurso StructureDefinition. Piezas clave:

- **url**: identificador canónico (ej. `http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient`). Con esa URL lo invocas en $validate y lo declaras en `meta.profile` de una instancia.
- **type**: a qué recurso aplica (Patient, Observation...).
- **baseDefinition**: de qué hereda (normalmente el recurso base R4, o incluso otro profile).
- **kind**: `resource` para profiles de recursos.
- **derivation**: `constraint` (un profile restringe) vs `specialization` (definir un tipo nuevo, uso interno de HL7).
- **differential**: SOLO lo que cambia respecto al base — es lo que escribe el autor.
- **snapshot**: la vista completa expandida (base + cambios aplicados) — es lo que consumen los validadores.

Differential vs snapshot es pregunta segura de examen: el differential es el "diff" legible por humanos; el snapshot es el resultado calculado completo.

### Slicing y must-support (nivel intro)

- **Slicing**: partir un elemento repetible en "rebanadas" con reglas propias. Ejemplo canónico: US Core Blood Pressure corta `Observation.component` en dos slices — sistólica y diastólica — cada una con su código LOINC obligatorio. El slicing necesita un **discriminator** (qué campo distingue las rebanadas, típicamente `code` o `system`).
- **must-support** (bandera `mustSupport: true`): "si tu sistema tiene este dato, debe poder poblarlo/procesarlo". No significa obligatorio (eso es cardinalidad 1..1); significa que no puedes ignorarlo por diseño.

### US Core

US Core es la IG más estudiada y el ejemplo canónico en el examen. Un Patient perfectamente válido en R4 base puede **fallar contra US Core** porque esta exige identifier, name y gender. Entrenarte leyendo US Core te prepara para leer cualquier IG (aunque DoctorSV esté en El Salvador).

## Chuleta

| Cosa | Clave |
|---|---|
| Validar | `POST [base]/Tipo/$validate` (+ `?profile=URL`) |
| $validate y HTTP | 200 = "procesado"; el veredicto está en el OperationOutcome |
| Rechazo en POST/PUT normal | 422 + OperationOutcome en el cuerpo |
| issue.severity | fatal, error, warning, information |
| issue.code (ejemplos) | required, invalid, structure, value, not-found |
| Dónde está el error | `expression` (FHIRPath) / `location` |
| Profile | StructureDefinition que RESTRINGE (nunca relaja) el base |
| differential vs snapshot | lo que cambia vs vista completa expandida |
| Declarar profile en instancia | `meta.profile: ["url-canónica"]` |
| Slicing | rebanar un elemento repetible con discriminator |
| must-support | debes poder manejarlo; NO es lo mismo que 1..1 |
| Validador oficial | Java validator de HL7 (ver enlaces) |

## Autoevaluación (sin mirar arriba)

1. $validate devolvió HTTP 200. ¿Puedes concluir que el recurso es válido? ¿Qué revisas?
2. Nombra los 4 valores de `issue.severity` en orden de gravedad y qué significa cada uno.
3. ¿Qué diferencia hay entre `differential` y `snapshot` en una StructureDefinition, y quién usa cada uno?
4. ¿Por qué un Patient válido en R4 base puede fallar contra US Core Patient?
5. ¿Qué significa must-support y en qué se diferencia de cardinalidad 1..1?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 7 Validación y Profiles".
2. Añade estos enlaces oficiales como fuentes:
  - http://hl7.org/fhir/R4/validation.html — las capas de validación y cómo funciona $validate.
  - http://hl7.org/fhir/R4/operationoutcome.html — estructura de issue: severity, code, expression.
  - https://hl7.org/fhir/us/core/ — US Core, la IG canónica para estudiar profiles reales.
  - https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator — el validador oficial Java, para validar en local.
  - https://fshschool.org/ — SUSHI/FSH: escribir profiles como código (mirando al Advanced).
3. Prompts sugeridos:
  - "Muéstrame 5 OperationOutcome de ejemplo y pídeme diagnosticar y corregir el recurso en cada caso."
  - "Explícame con el ejemplo de US Core Blood Pressure cómo funciona el slicing de Observation.component y su discriminator."
  - "Hazme preguntas tipo examen sobre differential vs snapshot, must-support vs cardinalidad, y 200-con-issues vs 422."

---

### Respuestas

1. No. El 200 solo indica que la validación se ejecutó. Hay que revisar el OperationOutcome del cuerpo y buscar issues con severity `error` o `fatal`.
2. `fatal` (no se pudo procesar), `error` (recurso inválido), `warning` (sospechoso pero aceptado), `information` (informativo).
3. `differential` contiene solo los cambios respecto al base (lo escribe el autor del profile); `snapshot` es la vista completa expandida base+cambios (la consumen los validadores y herramientas).
4. Porque US Core restringe el base: exige elementos que en R4 base son opcionales (identifier, name, gender). Un profile solo añade restricciones, y la instancia debe cumplirlas todas.
5. must-support = tu sistema debe ser capaz de poblar/procesar ese elemento si el dato existe; no obliga a que esté presente en cada instancia. Cardinalidad 1..1 sí obliga a que esté siempre.
