# 📱 Tema 6 · Terminologías clínicas

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Explicar para qué sirve cada vocabulario: LOINC, SNOMED CT, UCUM (y RxNorm/ICD-10 de pasada).
- Escribir un Coding correcto (system, code, display) y saber cuándo usar CodeableConcept.
- Distinguir CodeSystem, ValueSet y ConceptMap sin dudar.
- Recitar las cuatro fuerzas de binding (required, extensible, preferred, example) y sus consecuencias.
- Usar las operaciones de terminología: $expand, $lookup, $validate-code (y $translate).
- Depurar el error más común: códigos sin `system` o con el system equivocado.

## Lectura

### El problema: "glucosa" no es igual a "azúcar en sangre" (para una máquina)

Si un sistema escribe "glucosa" y otro "azúcar en sangre", ningún programa sabe que hablan de lo mismo. Las terminologías son diccionarios universales de códigos. Analogía: el código de barras de un producto — no importa el idioma del envase, el código identifica el producto exacto.

Los vocabularios que debes reconocer al instante:

- **LOINC** (`http://loinc.org`): identifica QUÉ se midió u observó — laboratorio y signos vitales. Ej: `8867-4` = frecuencia cardíaca. Es el system típico de `Observation.code`.
- **SNOMED CT** (`http://snomed.info/sct`): conceptos clínicos — diagnósticos, hallazgos, procedimientos. Typical en `Condition.code`.
- **UCUM** (`http://unitsofmeasure.org`): unidades de medida (`mg`, `mmol/L`, `/min`). Va en `Quantity.system` + `Quantity.code`.
- **RxNorm** (`http://www.nlm.nih.gov/research/umls/rxnorm`): medicamentos.
- **ICD-10**: clasificación de diagnósticos para facturación/estadística.

Truco memorable: LOINC responde "¿qué pregunta se hizo?" (la prueba); SNOMED responde "¿qué se concluyó?" (el concepto clínico).

### Coding vs CodeableConcept

- **Coding** = UN código concreto:

```json
{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }
```

  - `system`: la URL del vocabulario. Sin system, el código es ambiguo (¿8867-4 de quién?). Este es el bug número uno.
  - `code`: el código en sí. `display`: el texto humano oficial.

- **CodeableConcept** = un concepto que puede llevar VARIOS coding (el mismo concepto en distintos vocabularios) más un `text` libre:

```json
{
  "coding": [
    { "system": "http://snomed.info/sct", "code": "38341003", "display": "Hypertensive disorder" },
    { "system": "http://hl7.org/fhir/sid/icd-10", "code": "I10" }
  ],
  "text": "Hipertensión arterial"
}
```

Regla: si el elemento del recurso es de tipo CodeableConcept (como `Observation.code` o `Condition.code`), envuelve tus coding en el array — mandar un Coding "pelado" es error de estructura.

### La tríada de recursos de terminología

| Recurso | Qué es | Analogía |
|---|---|---|
| **CodeSystem** | Define un vocabulario completo y sus códigos (LOINC, SNOMED) | El diccionario entero |
| **ValueSet** | Selecciona un subconjunto de códigos de uno o más CodeSystems para un contexto | La lista de vocabulario permitida en un examen |
| **ConceptMap** | Mapea códigos entre vocabularios (SNOMED → ICD-10) | El traductor entre diccionarios |

Un ValueSet tiene dos caras: su definición **por composición** (`compose`: "todos los códigos de tal CodeSystem que cumplan X") y su **expansión** (`expansion`: la lista concreta de códigos resultante en un momento dado).

### Binding: qué tan obligatorio es un ValueSet

Cuando un elemento codificado se enlaza (binding) a un ValueSet, la fuerza del binding define las reglas:

- **required**: DEBES usar un código del ValueSet. Salirte = recurso inválido. (Ej: `Observation.status`.)
- **extensible**: usa el ValueSet salvo que ningún código aplique de verdad a tu concepto; solo entonces puedes usar otro.
- **preferred**: se recomienda, pero no es obligatorio.
- **example**: el ValueSet es solo ilustrativo.

En el examen te van a preguntar la diferencia entre required y extensible: required nunca permite salirse; extensible permite salirse solo si el concepto genuinamente no está cubierto.

### Operaciones de terminología (el servicio de terminología)

Un servidor de terminología (público: `https://tx.fhir.org/r4`) expone operaciones con `$`:

- **$expand** — expande un ValueSet a su lista concreta de códigos:

```
GET [base]/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender
```

  Devuelve el ValueSet con `expansion.contains` lleno de códigos.

- **$lookup** — dado system + code, devuelve el display y propiedades del concepto:

```
GET [base]/CodeSystem/$lookup?system=http://loinc.org&code=8867-4
```

- **$validate-code** — ¿este código es válido dentro de este ValueSet? Devuelve un resultado con `result: true/false`.

- **$translate** — usa un ConceptMap para traducir un código de un vocabulario a otro.

Estas cuatro operaciones devuelven sus resultados como recurso `Parameters` (no como el recurso original) — detalle fino que suele caer en preguntas.

### Errores comunes que debes cazar

1. Coding sin `system` → código ambiguo, inválido en bindings required.
2. Confundir LOINC (qué se midió) con SNOMED (concepto clínico).
3. Creer que CodeableConcept es un solo código: es una LISTA de coding + text.
4. Confundir CodeSystem (define códigos) con ValueSet (selecciona códigos).
5. Usar `unit` de Quantity como si fuera el código: la unidad computable va en `code` con system UCUM.

## Chuleta

| Cosa | Valor |
|---|---|
| LOINC system | `http://loinc.org` (qué se midió) |
| SNOMED system | `http://snomed.info/sct` (concepto clínico) |
| UCUM system | `http://unitsofmeasure.org` (unidades) |
| RxNorm system | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| Coding | system + code + display (UN código) |
| CodeableConcept | coding[] + text (varios códigos, un concepto) |
| CodeSystem / ValueSet / ConceptMap | define / selecciona / traduce |
| Bindings | required > extensible > preferred > example |
| $expand | ValueSet → lista de códigos |
| $lookup | system+code → display y propiedades |
| $validate-code | ¿código válido en el ValueSet? |
| Servidor tx público | `https://tx.fhir.org/r4` |

## Autoevaluación (sin mirar arriba)

1. ¿Qué vocabulario usarías para el código de una prueba de laboratorio y cuál para el diagnóstico resultante?
2. Escribe el JSON de un CodeableConcept para hipertensión con un coding SNOMED y text en español.
3. ¿Cuál es la diferencia entre CodeSystem y ValueSet? Da un ejemplo con signos vitales.
4. Si un binding es extensible y ningún código del ValueSet cubre tu concepto, ¿qué puedes hacer? ¿Y si es required?
5. ¿Qué operación usarías para obtener el display oficial de `8867-4` de LOINC, y sobre qué recurso se invoca?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 6 Terminologías".
2. Añade estos enlaces oficiales como fuentes:
   - http://hl7.org/fhir/R4/terminologies.html — el módulo oficial de terminología: bindings y uso de códigos.
   - http://hl7.org/fhir/R4/datatypes.html — definición formal de Coding, CodeableConcept y Quantity.
   - http://hl7.org/fhir/R4/resourcelist.html — para ubicar CodeSystem, ValueSet y ConceptMap con sus operaciones.
   - https://confluence.hl7.org/display/FHIR — FAQ y contexto de HL7 sobre el ecosistema de terminología.
3. Prompts sugeridos:
   - "Hazme 10 preguntas de opción múltiple sobre binding strength y corrige razonando cada una."
   - "Dame 6 códigos con su system y pídeme clasificar si son LOINC, SNOMED, UCUM o RxNorm y para qué elemento FHIR servirían."
   - "Explícame el flujo completo: definir un ValueSet de signos vitales, expandirlo con $expand y validar un código con $validate-code."

---

### Respuestas

1. LOINC para la prueba de laboratorio (qué se midió); SNOMED CT para el diagnóstico (concepto clínico).
2. `{ "coding": [{ "system": "http://snomed.info/sct", "code": "38341003", "display": "Hypertensive disorder" }], "text": "Hipertensión arterial" }`.
3. CodeSystem define el vocabulario completo (LOINC entero); ValueSet selecciona un subconjunto para un contexto (los ~9 códigos LOINC de signos vitales que tu campo permite).
4. Con extensible puedes usar un código de otro vocabulario porque el concepto no está cubierto; con required no hay escapatoria: solo códigos del ValueSet.
5. `$lookup`, invocada sobre CodeSystem: `GET [base]/CodeSystem/$lookup?system=http://loinc.org&code=8867-4`.
