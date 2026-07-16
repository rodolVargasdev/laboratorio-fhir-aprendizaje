# Validación y Profiles

> **En simple:** el estándar base es deliberadamente laxo; un **perfil** (StructureDefinition con `derivation: constraint`) lo endurece para un contexto concreto: cardinalidades, bindings, slicing, invariantes. La **validación** ($validate, validador oficial) comprueba instancias contra esos perfiles y responde con OperationOutcome. Este es el marco de conformidad completo: cubre Troubleshooting/Validation (15 %), el dominio de IGs (6 %) y es la competencia que te permite dirigir un perfilado nacional.

## El marco de conformidad y StructureDefinition

FHIR define una familia de **recursos de conformidad** que describen, restringen y declaran el comportamiento:

- **StructureDefinition**: define la forma de recursos, tipos de datos y extensiones (y sus perfiles).
- **ValueSet / CodeSystem / ConceptMap**: la capa terminológica (Tema 6).
- **SearchParameter / OperationDefinition**: parámetros y operaciones.
- **CapabilityStatement**: qué hace un servidor o qué exige un cliente.
- **ImplementationGuide**: el paquete que reúne todo lo anterior con narrativa y ejemplos.

Idea rectora: "JSON válido" ≠ "recurso FHIR válido" ≠ "recurso conforme a un perfil". Son tres niveles de exigencia crecientes, y cada nivel se comprueba con herramientas distintas.

### Anatomía de StructureDefinition

Los elementos que el examen espera que reconozcas:

| Elemento | Significado |
|---|---|
| `url` | La **canónica**: identidad global del artefacto (`http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient`). Es lo que va en `meta.profile` y en `$validate?profile=` |
| `version` + `status` | Versionado y madurez del artefacto |
| `kind` | `primitive-type`, `complex-type`, `resource`, `logical` |
| `abstract` | true en Resource/DomainResource: no se instancian |
| `type` | Qué tipo restringe/define (`Patient`) |
| `baseDefinition` | Canónica del padre (`http://hl7.org/fhir/StructureDefinition/Patient`) |
| `derivation` | **`constraint`** = perfil (restringe sin crear tipo nuevo); **`specialization`** = tipo nuevo (lo que hace la propia especificación al derivar Patient de DomainResource) |
| `context` | Solo para extensiones: dónde pueden usarse (p. ej. `Patient`, `Observation.component`) |
| `differential` | **Solo lo que cambia** respecto a la base: lo que el autor escribió |
| `snapshot` | La vista **completa y calculada**: base + cambios acumulados de toda la cadena. Los validadores trabajan sobre el snapshot; los humanos leen el differential |

Regla de oro del perfilado: un perfil solo puede **restringir** (cerrar cardinalidades, endurecer bindings, fijar valores), nunca abrir lo que la base prohíbe ni relajar lo que exige.

## ElementDefinition y slicing

### ElementDefinition: donde vive cada restricción

Cada entrada de differential/snapshot es un `ElementDefinition`:

- **`path`**: `Patient.identifier`, `Observation.value[x]`.
- **`min` / `max`**: cardinalidad (`1`/`"1"`, `0`/`"*"`). Perfilar `Patient.identifier` a `1..*` = "todo paciente nacional lleva identificador".
- **`type`**: tipos permitidos; en references, `targetProfile` restringe el destino (Reference(us-core-patient)).
- **`fixed[x]` vs `pattern[x]`** — diferencia de examen:
  - `fixedCodeableConcept`: la instancia debe ser **exactamente** ese valor, completo, sin nada más.
  - `patternCodeableConcept`: la instancia debe **contener al menos** lo especificado; puede traer codings o campos adicionales. Para "debe incluir el coding LOINC X (y puede llevar más)", usa pattern; fixed sobre un CodeableConcept con display incluido rompería instancias legítimas.
- **`binding`**: `strength` + `valueSet` (canónica). Solo endurecer respecto a la base.
- **`constraint`** (invariantes): `key`, `severity` (`error`/`warning`), `human` y `expression` en **FHIRPath**. Ejemplo real (us-core-9, sobre name): expresiones como `family.exists() or given.exists()` — "un nombre debe traer apellido o nombre de pila".
- **`mustSupport`**: bandera booleana cuyo significado lo define **el IG**, no la especificación. En general: el sistema debe ser capaz de poblar/consumir el elemento de forma significativa. **Must-support ≠ obligatorio**: un elemento 0..1 mustSupport puede faltar en una instancia válida; lo que no puede hacer tu sistema es ignorarlo por diseño.
- **`isModifier`**: marca elementos modificadores (status, clinicalStatus...).
- **`slicing`**: ver siguiente sección.

### Slicing a fondo

Slicing = partir un elemento repetitivo en **rebanadas** con reglas propias. Requiere tres decisiones:

1. **`discriminator`**: cómo distinguir a qué slice pertenece cada repetición. Tipos: `value` (por valor exacto de un sub-elemento), `pattern` (por pattern[x]; en R5 se fusiona con value), `type` (por tipo de dato), `profile` (por perfil que cumple el destino), `exists` (por presencia/ausencia).
2. **`rules`**: `open` (se permiten repeticiones fuera de los slices), `closed` (solo lo definido), `openAtEnd` (extras solo al final).
3. Los **slices** en sí, cada uno con nombre (`sliceName`) y sus restricciones.

Ejemplo 1 — slicing de `Patient.identifier` por sistema (perfil nacional):

```json
{ "path": "Patient.identifier", "slicing": {
    "discriminator": [{ "type": "value", "path": "system" }],
    "rules": "open" },
  "min": 1 },
{ "path": "Patient.identifier", "sliceName": "dui",
  "min": 1, "max": "1",
  "type": [{ "code": "Identifier" }] },
{ "path": "Patient.identifier.system", "id": "Patient.identifier:dui.system",
  "fixedUri": "https://fhir.gob.sv/id/dui" }
```

Lectura: los identifiers se discriminan por su `system`; debe existir exactamente un slice "dui" con system fijado; otros identifiers siguen permitidos (open).

Ejemplo 2 — slicing de `Observation.component` (presión arterial): discriminator `pattern` (o `value`) sobre `code`, con un slice "sistolica" (`patternCodeableConcept` con coding LOINC 8480-6, min 1) y otro "diastolica" (8462-4, min 1). Es exactamente lo que hace el perfil de presión arterial de US Core / vital signs.

## Perfiles vs extensiones, cadenas y meta.profile

- **Cuándo perfilar**: cuando la base permite demasiado (necesitas exigir identifier, fijar bindings, cortar opciones).
- **Cuándo extender**: cuando necesitas un dato que la base **no tiene** (municipio de residencia según catastro nacional). Las extensiones también se definen con StructureDefinition (kind complex-type, type Extension, con `context`).
- **Cadena de perfiles**: un perfil puede basarse en otro perfil. `us-core-patient` tiene `baseDefinition` = Patient base; un hipotético `sv-patient` podría basarse en Patient base o incluso en otro perfil regional. Cada eslabón solo restringe. El snapshot acumula toda la cadena.
- **`meta.profile` = conformidad *afirmada***: la instancia **dice** cumplir el perfil. Es una pista, no una prueba: la conformidad **validada** solo existe tras pasar el validador contra ese perfil. Un servidor puede validar al ingreso, o aceptar y validar después; el examen distingue claimed vs validated.

## $validate, OperationOutcome y herramientas

La operación:

```http
POST [base]/Patient/$validate?profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
Content-Type: application/fhir+json

{ "resourceType": "Patient", ... }
```

Modos (`mode`): `create`, `update`, `delete` — valida "¿podría ejecutar esta operación?" además de la estructura. Sin `profile`, valida contra la base + los perfiles de `meta.profile`.

Respuesta: **siempre** un `OperationOutcome` (usualmente HTTP 200 aunque haya errores de contenido — el 200 significa "la validación se ejecutó"; compáralo con un create real, donde un recurso inválido produce 400/422 con OperationOutcome en el cuerpo):

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "required",
      "diagnostics": "Patient.identifier: minimum required = 1, but only found 0",
      "expression": ["Patient.identifier"]
    },
    {
      "severity": "warning",
      "code": "code-invalid",
      "diagnostics": "None of the codings are from the required value set",
      "expression": ["Patient.gender"]
    }
  ]
}
```

- **`severity`**: `fatal` (no se pudo ni procesar), `error` (no conforme), `warning` (aceptable pero sospechoso; incluye best practices y bindings extensible/preferred incumplidos según configuración), `information`.
- **`code`**: la categoría del problema, de un conjunto required (`required`, `structure`, `invariant`, `code-invalid`, `not-found`, `business-rule`...).
- **`expression`**: la **ruta FHIRPath** al elemento problemático — tu mapa para corregir.
- `diagnostics` y `details` (CodeableConcept) completan el mensaje.

Criterio operativo: una instancia "pasa" si no hay issues con severity `fatal` o `error`.

### Herramientas del oficio

- **Validador oficial Java** (el de referencia, mantenido por HL7):
  ```bash
  java -jar validator_cli.jar paciente.json -version 4.0.1 \
    -ig hl7.fhir.us.core#7.0.0 \
    -profile http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
  ```
  Descarga los paquetes IG desde el registro, usa tx.fhir.org como servidor de terminología (configurable con `-tx`), y reporta issues con expression. Es lo que corre dentro de HAPI y del IG Publisher.
- **HAPI FHIR**: el servidor/librería Java open source; su `FhirValidator` embebe el mismo núcleo. HAPI público responde `$validate` en línea.
- **FSH / SUSHI** (FHIR Shorthand): lenguaje textual para autoría de perfiles, compilado por SUSHI a StructureDefinitions. Un perfil en FSH:
  ```
  Profile: PacienteNacional
  Parent: Patient
  Id: sv-paciente
  * identifier 1..* MS
  * identifier ^slicing.discriminator.type = #value
  * identifier ^slicing.discriminator.path = "system"
  * identifier ^slicing.rules = #open
  * identifier contains dui 1..1 MS
  * identifier[dui].system = "https://fhir.gob.sv/id/dui" (exactly)
  * gender 1..1
  ```
  Legible, versionable en git, y la comunidad (fshschool.org) lo ha convertido en el estándar de facto de autoría.
- **Forge** (Firely) y **Simplifier.net**: editor visual de perfiles y plataforma de publicación/colaboración.
- **IG Publisher**: la herramienta oficial que convierte un proyecto (FSH o JSON) en un Implementation Guide navegable en HTML con validación integral. **registry.fhir.org** indexa los paquetes publicados.
- **Inferno** (inferno.healthit.gov): banco de pruebas de conformidad usado en certificación (US Core/SMART); modelo a imitar para pruebas nacionales.

## CapabilityStatement y estrategia institucional

### CapabilityStatement: el contrato del servidor

`GET [base]/metadata` devuelve el CapabilityStatement. Elementos clave:

- **`kind`**: `instance` (este servidor concreto), `capability` (lo que un software puede hacer), `requirements` (lo que un proyecto exige).
- **`rest.resource[]`**: por cada tipo: `profile` y `supportedProfile`, `interaction[]` (read, vread, update, patch, delete, history, create, search-type), `searchParam[]` declarados, `searchInclude`/`searchRevInclude`, políticas de versionado (`versioning`), `conditionalCreate`/`conditionalUpdate`.
- `rest.interaction` a nivel sistema (transaction, batch, history-system) y `rest.operation` ($validate, $expand...).

Léelo **antes** de programar contra un servidor: es la declaración formal de qué búsquedas y operaciones existen. En una red nacional, el CapabilityStatement `requirements` es el documento contractual que los proveedores deben satisfacer, verificable con herramientas tipo Inferno / Touchstone.

### Estrategia institucional: perfilado nacional paso a paso

1. **Casos de uso primero**: define qué intercambios existen (referencia y retorno, laboratorio, vacunación) y qué datos mínimos exige cada uno. Sin caso de uso, no hay perfil.
2. **Modelo de datos mínimo**: por recurso, decide cardinalidades, mustSupport y terminología nacional (Tema 6).
3. **Autoría en FSH** sobre una base bien elegida (recursos base R4; evalúa alinearte con perfiles internacionales — IPS, US Core como referencia arquitectónica).
4. **Extensiones solo donde falte el dato** (municipio, programa de salud), con canónicas del dominio nacional.
5. **Validación continua**: IG Publisher + validador en CI; ejemplos válidos e inválidos como suite de pruebas.
6. **Publicación**: IG navegable + paquete NPM en un registro; los proveedores validan contra el paquete, no contra PDFs.
7. **Certificación**: banco de pruebas automatizado (estilo Inferno) como requisito de conexión a la red.
8. **Gobernanza de versiones**: los perfiles evolucionan; define política semver, ventanas de convivencia y deprecación.

## Errores comunes y gotchas

- **Creer que must-support = obligatorio**: mustSupport habla de la **capacidad del sistema**, no de la presencia en cada instancia. Un elemento 0..1 MS puede faltar en una instancia conforme.
- **Confundir fixed[x] con pattern[x]**: fixed exige igualdad total (nada extra); pattern exige contener lo especificado. Fijar un CodeableConcept entero con fixed suele romper instancias con codings adicionales legítimos.
- **Confundir differential con snapshot**: el differential no es "el perfil resumido para validar": los validadores necesitan el snapshot (o generarlo). Si editas a mano un differential sin regenerar snapshot, tu servidor puede validar contra una vista desactualizada.
- **Tomar meta.profile como prueba de conformidad**: es una afirmación (claimed). Sin validación, no hay garantía; y buscar con `_profile=` solo encuentra lo afirmado.
- **Intentar relajar la base**: un perfil no puede hacer opcional `Observation.status` ni ampliar un binding required. Solo restringe.
- **$validate devolvió 200, "todo bien"**: 200 significa que la validación corrió; revisa los issues. Pasa solo sin fatal/error.
- **Slicing sin discriminator utilizable**: si el discriminador no permite decidir el slice inspeccionando la instancia (path inexistente, valores no fijados en los slices), el slicing es inválido o inaplicable.
- **Olvidar `context` en extensiones**: una extensión sin contexto correcto valida en sitios donde no debía usarse (o falla donde sí).
- **Validar sin servidor de terminología**: los bindings contra SNOMED/LOINC no se comprueban; falsos "válidos". El validador oficial usa tx.fhir.org salvo que configures otro.
- **Endurecer sin datos**: exigir 1..1 en campos que los sistemas reales no capturan garantiza el fracaso del despliegue; perfila sobre evidencia de calidad de datos.

## Nivel experto

- **Generación de snapshots**: el algoritmo mezcla la cadena de baseDefinitions elemento a elemento; las discrepancias differential/snapshot son una fuente clásica de bugs en IGs de terceros. Herramientas: el propio validador (`-snapshot`), SUSHI y HAPI generan snapshots.
- **Invariantes FHIRPath avanzadas**: las constraints pueden cruzar elementos (`value.exists() xor dataAbsentReason.exists()`) y usar funciones (`memberOf()`, `conformsTo()`, `resolve()`). `resolve()` en perfiles de Bundle permite validar el grafo completo de un documento.
- **Validación por capas en producción**: estructura (barata, en el borde) -> terminología (tx-server, cacheada) -> invariantes de negocio (motor de reglas). No todo tiene que rechazar: decide qué severidades bloquean el ingreso y cuáles generan colas de corrección.
- **US Core como caso de estudio**: el IG estadounidense define el piso regulatorio (USCDI); su versión 9 salta la base R4->R6, señal de la transición de todo el ecosistema. Estúdialo por su **arquitectura** (patrones de mustSupport, slicing de vital signs, CapabilityStatements por actor), no para copiarlo literal.
- **R5/R6**: la balota normativa de R6 consolida recursos clave; en conformidad, R5 añade refinamientos (discriminator pattern fusionado en value, nuevas capacidades de ElementDefinition). El marco conceptual que aprendiste aquí no cambia.
- **Dirigir el perfilado**: la decisión más cara no es técnica sino de gobernanza: quién aprueba cambios de perfil, cómo se versionan las canónicas y qué pasa con los datos históricos validados contra versiones viejas. Deja eso escrito antes del primer despliegue.

## Chuleta

| Concepto | Clave |
|---|---|
| derivation | constraint = perfil; specialization = tipo nuevo |
| differential vs snapshot | Lo que cambia vs vista completa calculada; el validador usa snapshot |
| Perfil | Solo restringe: cardinalidades, bindings (endurecer), tipos, slicing, invariantes |
| fixed[x] vs pattern[x] | Igualdad total vs "debe contener al menos" |
| mustSupport | Capacidad del sistema (definida por el IG) ≠ obligatorio en la instancia |
| Slicing | discriminator (value/pattern/type/profile/exists) + rules (open/closed/openAtEnd) + slices con sliceName |
| Extensión | StructureDefinition con type Extension y context; para datos que la base no tiene |
| meta.profile | Conformidad afirmada (claimed); la validada requiere $validate/validador |
| $validate | POST [Tipo]/$validate?profile=...; mode create/update/delete; responde OperationOutcome (200 = corrió) |
| OperationOutcome.issue | severity fatal/error/warning/information + code + expression (FHIRPath al problema) |
| Validador oficial | java -jar validator_cli.jar recurso.json -version 4.0.1 -ig paquete -profile canónica |
| FSH/SUSHI | Autoría textual de perfiles -> StructureDefinition; IG Publisher publica el IG |
| CapabilityStatement | kind instance/capability/requirements; rest.resource.interaction + searchParam = el contrato |
| Cadena de perfiles | base -> perfil -> perfil; snapshot acumula; cada eslabón solo restringe |

## Autoevaluación

1. ¿Qué diferencia hay entre `derivation: constraint` y `derivation: specialization`, y cuál usa un perfil nacional?
2. Explica differential vs snapshot y por qué el validador necesita el segundo.
3. Un elemento es 0..1 con mustSupport en un IG. ¿Puede faltar en una instancia conforme? ¿Qué exige entonces mustSupport?
4. ¿Cuándo usarías pattern[x] en lugar de fixed[x] sobre un CodeableConcept?
5. Diseña (verbalmente) el slicing de Patient.identifier para exigir exactamente un DUI y permitir otros identificadores.
6. ¿Qué significa que una instancia tenga us-core-patient en meta.profile pero falle $validate contra esa canónica?
7. Escribe el comando del validador oficial para validar `obs.json` contra un perfil de un IG.
8. En un OperationOutcome, ¿qué te dicen severity, code y expression, y con qué criterio decides si la instancia "pasó"?

### Respuestas

1. constraint restringe un tipo existente sin crear uno nuevo (eso es un perfil); specialization crea un tipo nuevo (lo hace la especificación misma, p. ej. Patient sobre DomainResource). Un perfil nacional siempre es constraint.
2. El differential contiene solo los cambios que escribió el autor; el snapshot es la vista completa resultante de fusionar toda la cadena de bases. El validador evalúa cada elemento de la instancia contra la definición completa, por eso requiere (o genera) el snapshot.
3. Sí puede faltar (su min es 0). mustSupport exige que el **sistema** sea capaz de poblar/procesar el elemento significativamente, según lo defina el IG; prohíbe ignorarlo por diseño, no exige su presencia por instancia.
4. Cuando la instancia debe contener al menos ciertos codings pero puede llevar más (otros codings, text): pattern permite contenido adicional; fixed exigiría igualdad exacta y total.
5. Slicing sobre Patient.identifier con discriminator type=value path=system, rules=open; slice "dui" 1..1 con system fijado (fixedUri https://fhir.gob.sv/id/dui); identifier global min 1.
6. Su conformidad es solo afirmada (claimed): declara el perfil pero no lo cumple. La conformidad validada es la que demuestra el validador; los servidores no están obligados a verificar meta.profile al ingreso.
7. `java -jar validator_cli.jar obs.json -version 4.0.1 -ig hl7.fhir.us.core#7.0.0 -profile http://hl7.org/fhir/us/core/StructureDefinition/us-core-blood-pressure` (ajustando paquete y canónica).
8. severity = gravedad (fatal/error/warning/information), code = categoría del problema (required, invariant, code-invalid...), expression = ruta FHIRPath al elemento afectado. Pasa si no hay issues fatal ni error.

## Para profundizar

- [Profiling R4](http://hl7.org/fhir/R4/profiling.html) — perfiles, slicing, discriminators y reglas de restricción.
- [StructureDefinition R4](http://hl7.org/fhir/R4/structuredefinition.html) — anatomía completa del recurso de conformidad central.
- [Validation R4](http://hl7.org/fhir/R4/validation.html) — qué se valida y con qué herramientas.
- [OperationOutcome R4](http://hl7.org/fhir/R4/operationoutcome.html) — severidades y códigos de issue.
- [Using the FHIR Validator (Confluence)](https://confluence.hl7.org/spaces/FHIR/pages/35718580/Using+the+FHIR+Validator) — la guía práctica del validador oficial Java.
- [FSH School](https://fshschool.org/) — aprender FHIR Shorthand y SUSHI haciendo.
- [US Core](https://hl7.org/fhir/us/core/) — el IG de referencia para estudiar arquitectura de perfilado.
- [Inferno](https://inferno.healthit.gov/) — pruebas de conformidad automatizadas; modelo para una certificación nacional.
