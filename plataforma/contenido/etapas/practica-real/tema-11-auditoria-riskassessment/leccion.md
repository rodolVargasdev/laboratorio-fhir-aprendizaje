# Auditoría de un recurso real: el RiskAssessment del orquestador de prevención

> **En simple:** hasta aquí todo lo que validaste fue material de práctica. Este tema
> usa un recurso **de nuestra propia institución**: un `RiskAssessment` R4 que emite el
> orquestador de prevención y que hoy vive en un FHIR store de Cloud Healthcare API.
> Vas a hacer lo que hace un implementador senior el primer día en un proyecto: leerlo,
> auditarlo contra el estándar, separar lo que está bien de lo que va a doler en dos
> años, refactorizarlo y escribir el perfil que impida que vuelva a pasar. No es un
> ejercicio hipotético: el resultado es el primer borrador real de nuestra guía de
> implementación nacional.

> **Nota de datos:** el recurso que estudias fue anonimizado — UUIDs regenerados y
> valores de laboratorio perturbados. La estructura es idéntica al original. Nunca
> lleves un recurso con datos reales de paciente a HAPI público ni a un cuaderno de
> NotebookLM.

## 1. Qué es RiskAssessment y qué no es

`RiskAssessment` responde a una pregunta: *dado lo que sé de este paciente, ¿qué
desenlace podría ocurrir y con qué probabilidad?* Es un recurso de la categoría
*Clinical Reasoning*: la salida de un razonamiento, no el razonamiento mismo.

Anatomía de los elementos que nos importan (R4):

| Elemento | Card. | Significado | Error frecuente |
|---|---|---|---|
| `identifier` | 0..* | Identidad de negocio, estable y única | Meterle un estado o una bandera |
| `status` | 1..1 | `registered \| preliminary \| final \| amended \| corrected \| cancelled \| entered-in-error \| unknown` | Duplicarlo en `identifier` o en una extensión |
| `code` | 0..1 | **Qué tipo de evaluación es** | Dejarlo vacío y usar `method` para todo |
| `method` | 0..1 | **Con qué mecanismo se evaluó** (el algoritmo, la escala) | Confundirlo con `code` |
| `subject` | 1..1 | El paciente | — |
| `condition` | 0..1 | **La condición evaluada** (Reference(Condition)) | Modelarla como extensión |
| `performer` | 0..1 | Quién/qué produjo la evaluación (puede ser un `Device`) | Omitirlo: nadie sabe qué versión del motor lo emitió |
| `basis` | 0..* | **La información en que se basó** (Observation, Condition...) | Meter ahí la ejecución anterior |
| `basedOn` | 0..1 | La petición/recurso que esta evaluación cumple | — |
| `parent` | 0..1 | El evento del que esta evaluación es parte | — |
| `prediction` | 0..* | Un desenlace potencial: `outcome`, `probability[x]`, `qualitativeRisk`, `relativeRisk`, `when[x]`, `rationale` (string) | Usarlo como diccionario clave-valor |

La distinción `code` vs `method` es la que más se falla en el examen: `code` es *qué
evaluación es* (riesgo cardiovascular), `method` es *cómo se calculó* (Framingham,
ASCVD, un motor de reglas propio). En nuestro recurso, `method` carga "Prevención
Secundaria" — que es más bien el *tipo* de evaluación — y `code` está vacío.

## 2. Lo que el recurso hace bien

Auditar no es despedazar. Antes de la lista de hallazgos, lo correcto:

- **Es R4 válido en estructura.** Pasa el `$validate` contra el core sin errores de
  cardinalidad. El equipo entendió el modelo básico.
- **`subject` con referencia relativa** (`Patient/<id>`) — la forma correcta dentro de
  un mismo store.
- **Extensiones con URL absoluta y propia** (`http://goes.gob.sv/fhir/extensions/...`).
  Es lo que exige la especificación: nada de nombres inventados sin URL.
- **Coherencia temporal.** `occurrenceDateTime` es `2026-08-04T11:40:15-06:00` y
  `meta.lastUpdated` es `2026-08-04T17:40:16Z`: **el mismo instante** expresado en dos
  husos, con un segundo de diferencia entre el evento y su persistencia. Saber leer eso
  sin alarmarse es parte del oficio.
- **`meta.versionId` opaco** (`MTc4NTg2NTIx...`): es Cloud Healthcare API asignando
  versión. No es un dato corrupto y no debes interpretarlo ni ordenarlo — para
  historial se usa `_history`, no el contenido del versionId.

## 3. Los hallazgos, de menor a mayor gravedad

### 3.1 `identifier` usado como bandera de estado

```json
"identifier": [{
  "system": "http://goes.gob.sv/fhir/prevention-program",
  "value": "preliminary"
}]
```

Un `identifier` es la **identidad de negocio**: el número que un humano o un sistema
externo usa para encontrar este recurso otra vez. `preliminary` no identifica nada —
lo comparten todos los recursos preliminares del país. La consecuencia práctica es
inmediata: `GET /RiskAssessment?identifier=preliminary` devuelve millones de filas y
no hay forma de buscar *esta* evaluación por su folio.

Y el agravante: `preliminary` **es un valor legal de `RiskAssessment.status`**. El
estándar ya modelaba exactamente lo que se quería decir. Aquí el recurso declara
`status: "final"` mientras el `identifier` dice `preliminary` y la fase dice
`proposed`: tres verdades distintas sobre el mismo hecho.

Regla: `id` es la llave técnica del servidor, `identifier` es el folio del negocio,
`status` es dónde va en el flujo. Tres cosas, tres lugares.

### 3.2 El código ICD-11 sin `system`, y un `code` que no es código

```json
{ "url": "code", "valueCode": "5C80.0Z" },
{ "url": "conditionDisplay", "valueCode": "Hipercolesterolemia, sin especificación" }
```

Dos problemas en tres líneas. Primero, `5C80.0Z` es ICD-11 MMS pero nadie lo dice: sin
`http://id.who.int/icd/release/11/mms` ese código es una cadena sin dueño, y un
consumidor no puede resolverlo, traducirlo ni validarlo contra un ValueSet. Segundo,
`conditionDisplay` usa `valueCode` para texto humano: un `code` es un símbolo tomado de
un sistema cerrado, no una frase. Ahí corresponde `valueString` o, mucho mejor, un
`valueCoding` completo que lleve `system`, `code` y `display` juntos y deje de
desparramar el mismo concepto en tres extensiones hermanas.

### 3.3 Un CodeableConcept con dos conceptos distintos adentro

```json
"outcome": { "coding": [
  { "code": "phase_2_dis",  "display": "phase_2_dis",  "system": ".../prevention-phase/phase"  },
  { "code": "proposed",     "display": "Fase Propuesta...", "system": ".../prevention-phase/status" }
]}
```

La especificación es explícita: las `coding` de un `CodeableConcept` son
**codificaciones alternativas del mismo concepto** — el mismo significado dicho en
SNOMED, en LOINC y en el catálogo local. Aquí hay dos conceptos diferentes (*cuál es la
fase* y *en qué estado está esa fase*) apretados en un solo campo. Cualquier consumidor
que haga lo correcto —tomar la primera `coding` que reconozca— obtendrá una respuesta
al azar entre dos preguntas distintas.

De paso: `display` repite el `code` (`"phase_2_dis"`). `display` es la etiqueta para
humanos; si es igual al código, no aporta nada y delata que se generó por copia.

### 3.4 `prediction` usado como diccionario clave-valor

El segundo `prediction` del recurso no predice nada:

```json
{ "outcome": { "coding": [{ "code": "-1", "display": "Nivel dentro de la fase de prevención" }] } }
```

`prediction.outcome` significa *el desenlace potencial que podría ocurrirle al
paciente*. Un "grado = -1" no es un desenlace: es un atributo de la evaluación. Al
meterlo aquí, un lector estándar entiende que el paciente tiene dos desenlaces posibles
—"fase 2" y "nivel -1"— lo cual es falso, y además el `prediction` queda sin
`probability` ni `qualitativeRisk`, que es lo que da sentido al elemento.

Un atributo así se modela con una extensión sobre el recurso (una, simple, con su
StructureDefinition publicada), no torciendo un elemento clínico.

### 3.5 El hallazgo grave: JSON serializado dentro de `rationale`

```json
"rationale": "{\"engine_context\": {\"observations_snapshot\": {\"colesterol_total_mg_dl\": 226.0, ...}}}"
```

`prediction.rationale` es un `string`, así que esto es **sintácticamente legal**: pasa
`$validate` sin una sola queja. Y es, con diferencia, el peor problema del recurso.

Dentro de ese string viajan datos de primera clase: los valores de laboratorio que
motivaron la decisión (colesterol 226, LDL 162, HDL 38, IMC 29.4), las reglas del YAML
que dispararon, la cita que se propone y los estudios a ordenar. Son datos clínicos
disfrazados de texto. El costo:

| Lo que pierdes | Por qué duele |
|---|---|
| Búsqueda | `Observation?code=2093-3&value-quantity=gt200` no encuentra nada. El colesterol no existe para el servidor |
| Validación | Ningún perfil, ningún ValueSet, ningún rango de referencia se aplica a texto |
| Terminología | Los códigos internos (`101115`, `codeTCA`) nunca se mapean a LOINC |
| Trazabilidad | `basis` debería *apuntar* a las Observation reales; en vez de eso las fotocopia |
| Analítica | El export a BigQuery entrega una columna de texto, no columnas numéricas |
| Evolución | Cambiar el formato del blob rompe a todos los consumidores en silencio, sin versión ni contrato |

La forma correcta ya existe en el estándar y no requiere inventar nada:

- Cada medición es una `Observation` con su LOINC. `carga_aterogenica` e `imc` son
  Observation calculadas, con `derivedFrom` a sus insumos.
- `basis` referencia esas Observation. Eso *es* la trazabilidad: quien lea la
  evaluación puede recorrer con `_include` los datos exactos que la produjeron.
- Las citas y estudios propuestos son `ServiceRequest` (o `RiskAssessment.mitigation`
  en texto, si solo se quiere la recomendación).
- La versión del motor y del YAML van en `performer` (un `Device` que representa al
  orquestador, con su `version`) y/o en `Provenance`. No en un blob.
- Si el objetivo de fondo es publicar las reglas como algo ejecutable y auditable, el
  camino del estándar es `PlanDefinition` + la operación `$apply` (módulo Clinical
  Reasoning). Es la conversación de arquitectura que este hallazgo debe abrir.

Además el blob viene **duplicado** en los dos `prediction`: el mismo contexto, dos
veces, en un recurso que ya pesa varias veces lo que debería.

### 3.6 Contexto clínico en una extensión que el core ya modelaba

```json
"method": { "extension": [{ "url": ".../prevention-assessment/context",
  "extension": [{ "url": "activeProblem", "extension": [ ... conditionReference ... ] }] }] }
```

Poner extensiones sobre un `CodeableConcept` es legal (todo `Element` las admite), pero
el contenido no debía estar ahí: la hipercolesterolemia evaluada es exactamente
`RiskAssessment.condition`, que existe en el core con cardinalidad 0..1 y tipo
`Reference(Condition)`. El `status: confirmed` del problema pertenece al
`Condition.clinicalStatus`/`verificationStatus` del recurso referenciado, no a una copia
local.

**La regla de oro de la extensibilidad:** antes de escribir una extensión, busca el
elemento del core. Extender lo que el estándar ya modela es la forma más rápida de
volverse no interoperable *mientras* se cumple la sintaxis. Un consumidor genérico que
lea `RiskAssessment.condition` no encontrará nada; solo un cliente que conozca nuestra
extensión sabrá dónde mirar. Eso es un formato propietario con envoltura FHIR.

### 3.7 Gobernanza: canónicas que no resuelven y conformidad no declarada

- No hay `meta.profile`. El recurso no afirma cumplir nada, así que no hay contra qué
  validarlo: es la diferencia entre **conformidad afirmada y conformidad validada**.
  Sin afirmación, la validación automática en la puerta es imposible.
- Las URLs `.../fhir/codeable-concept/prevention-phase/phase` nombran *CodeSystems*
  usando el nombre de un tipo de dato. La convención es
  `http://goes.gob.sv/fhir/CodeSystem/prevention-phase`, y esa URI debería **resolver**
  a la definición publicada.
- No existe ningún `CodeSystem`, `ValueSet` ni `StructureDefinition` publicado para
  `phase_2_dis`, `secondary`, `proposed` o el grado. Los códigos son privados de facto.
- Convive con la canónica `https://fhir.salud.gob.sv/` que definimos en el proyecto
  integrador. **Un país, una canónica**: elegir cuál es y documentarlo es una decisión
  de gobernanza de por vida, y es lo primero que debe zanjar el comité.

## 4. Cómo se ve el recurso corregido

En una frase: casi todo lo que hoy es extensión o texto se convierte en elementos del
core y en referencias.

```
RiskAssessment
├── meta.profile      -> [".../StructureDefinition/riskassessment-prevencion-sv"]
├── identifier        -> folio real del programa (system + value único)
├── status            -> "preliminary" (la ejecución preliminar del orquestador)
├── code              -> "Evaluación de fase de prevención" (CodeSystem propio)
├── method            -> "Prevención Secundaria"
├── condition         -> Condition/<hipercolesterolemia>   (era una extensión)
├── performer         -> Device/orquestador-prevencion (versión del motor y del YAML)
├── basedOn / parent  -> RiskAssessment/<ejecución anterior>   (era basis)
├── basis             -> [Observation/colesterol, Observation/hdl, Observation/ldl,
│                         Observation/trigliceridos, Observation/pa, Observation/imc]
├── prediction[0]
│   ├── outcome       -> SOLO la fase (una coding, un concepto)
│   ├── qualitativeRisk / when  -> lo que el modelo realmente predice
│   └── rationale     -> texto humano corto y legible, no JSON
├── extension[fase-estado]  -> "proposed"    (extensión simple, publicada)
├── extension[grado]        -> -1            (extensión simple, publicada)
└── mitigation        -> "Control con médico metabólico en 4 meses"
```

Lo que se gana: el colesterol se vuelve buscable, la condición se vuelve navegable con
`_include`, la fase se vuelve validable contra un ValueSet, la versión del motor se
vuelve auditable, y el recurso adelgaza porque deja de fotocopiar datos que ya existen
en otra parte.

## 5. Cómo se audita cualquier recurso ajeno (el método, para reusar)

1. **Valida contra el core** primero. Lo que ni siquiera pasa `$validate` no merece
   discusión de diseño.
2. **Recorre el JSON preguntando "¿de quién es este dato?"** — cada campo pertenece a un
   recurso; si está aquí como copia, es deuda.
3. **Lista las extensiones y busca su elemento del core.** Cada extensión que sobreviva
   necesita justificación escrita y StructureDefinition publicada.
4. **Busca strings sospechosamente largos.** JSON, XML o CSV dentro de un string es
   siempre un hallazgo grave.
5. **Verifica que cada código tenga `system`** y que ese `system` sea resoluble.
6. **Contrasta los estados**: `status`, banderas de negocio y campos de flujo deben
   contar la misma historia.
7. **Cierra con severidades y con costo de migración**, no con una lista de quejas. La
   auditoría que no propone camino no se implementa.

## 6. Por qué esto importa más allá del examen

El Foundational Implementer te va a preguntar por `identifier` vs `id`, por cuándo
extender, por qué significa una `coding`. Este recurso te lo enseña con nuestra propia
producción de por medio, que es como se aprende de verdad. Pero el objetivo real es
otro: cada uno de estos hallazgos, hoy, cuesta una tarde de refactor; dentro de dos
años, con tres sistemas consumiendo el blob de `rationale`, cuesta un proyecto.
