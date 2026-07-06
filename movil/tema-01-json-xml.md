# 📱 Tema 1 · JSON y XML: el lenguaje de los datos

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Leer cualquier JSON con soltura: objetos `{}`, arrays `[]`, claves y valores.
- Navegar recursos FHIR con rutas tipo `Patient.name[0].family`.
- Reconocer los tipos de dato FHIR más frecuentes: CodeableConcept, Coding, Quantity, Reference, Identifier.
- Leer el mismo recurso en XML y saber en qué se diferencia del JSON (atributo `value`, etiquetas repetidas).
- Evitar los errores clásicos: confundir objeto con array, `code` con `display`, olvidar que `name` es lista.

## Lectura

### Por qué empezamos aquí

FHIR intercambia datos clínicos principalmente en **JSON** (JavaScript Object Notation). Si lees JSON con soltura, ya tienes la mitad de la base que el examen Foundational da por sabida. XML también es formato oficial de FHIR: no necesitas escribirlo a mano, pero sí **leerlo** sin miedo.

### JSON: la ficha con casillas

Piensa en una ficha de paciente con casillas:

- Un par `"clave": valor` es una casilla con etiqueta y dato.
- Un objeto `{ }` agrupa casillas relacionadas.
- Un array `[ ]` es una lista ordenada (varios teléfonos, varios nombres).

Valores posibles: texto entre comillas (`"female"`), números sin comillas (`72`), booleanos (`true`/`false`), `null`, otro objeto o un array. Ojo: en FHIR las fechas van como texto `"1985-04-12"` (formato ISO), no como número.

Un Patient mínimo:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo-1",
  "active": true,
  "name": [
    { "use": "official", "family": "Hernandez", "given": ["Maria", "Jose"] }
  ],
  "gender": "female",
  "birthDate": "1985-04-12"
}
```

Tres detalles que caen en examen:

- `resourceType` está en **todo** recurso FHIR y dice qué tipo es. Es lo primero que miras.
- `name` es un **array** aunque haya un solo nombre, porque una persona puede tener varios (oficial, de soltera, apodo). En FHIR, si un elemento tiene cardinalidad 0..* o 1..*, en JSON siempre es array.
- Dentro de `name`, `given` es otro array (varios nombres de pila), pero `family` es un texto simple.

### Rutas: tu GPS dentro del recurso

El apellido de arriba es `Patient.name[0].family` → "Hernandez". Se lee: del Patient, el primer elemento (índice **0**, no 1) de `name`, su campo `family`. El primer nombre de pila es `Patient.name[0].given[0]` → "Maria". Esta notación aparece en toda la documentación FHIR, en los perfiles y en el examen. Interiorízala: **punto** para entrar a un objeto, **[n]** para elegir dentro de un array.

### Anidamiento real: una Observation

Los recursos reales anidan objetos dentro de objetos. Este es un signo vital:

```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [
      { "system": "http://loinc.org", "code": "8867-4", "display": "Frecuencia cardiaca" }
    ],
    "text": "Frecuencia cardiaca"
  },
  "subject": { "reference": "Patient/123" },
  "valueQuantity": { "value": 72, "unit": "latidos/min",
    "system": "http://unitsofmeasure.org", "code": "/min" }
}
```

Rutas útiles: `Observation.code.coding[0].code` → "8867-4"; `Observation.valueQuantity.value` → 72; `Observation.subject.reference` → "Patient/123".

### Los tipos de dato que se repiten en todo FHIR

FHIR reutiliza unos pocos patrones una y otra vez. Si los reconoces, cualquier recurso te resulta familiar:

- **CodeableConcept**: objeto con `coding` (lista de códigos formales) y `text` (texto legible para humanos). ¿Por qué ambos? `coding` permite que las máquinas comparen ("8867-4 de LOINC es frecuencia cardiaca en cualquier país"); `text` conserva lo que el humano escribió o vio. Puede haber varios `coding` porque el mismo concepto puede codificarse en LOINC y SNOMED CT a la vez.
- **Coding**: cada elemento de esa lista, con `system` (la URL del sistema de códigos, p. ej. `http://loinc.org`), `code` (el código) y `display` (su texto oficial). Error clásico: confundir `code` (para máquinas) con `display` (para humanos).
- **Quantity**: valor numérico con unidad. Trae `value`, `unit` (texto libre) y opcionalmente `system` + `code` con la unidad formal en **UCUM** (`http://unitsofmeasure.org`).
- **Reference**: cómo un recurso apunta a otro: `{ "reference": "Patient/123" }`. Así se compone el rompecabezas: la Observation no repite los datos del paciente, lo referencia.
- **Identifier**: identificadores "del mundo real" (DUI, número de expediente), con `system` + `value`. No lo confundas con `id`, que es el identificador técnico del recurso en ese servidor.

### XML: el mismo dato, otro traje

FHIR define el mismo contenido en XML. La misma Observation:

```xml
<Observation xmlns="http://hl7.org/fhir">
  <status value="final"/>
  <code>
    <coding>
      <system value="http://loinc.org"/>
      <code value="8867-4"/>
    </coding>
  </code>
</Observation>
```

Tres reglas para leer XML FHIR sin sufrir:

1. Los valores primitivos van en el **atributo `value`** de la etiqueta: `<status value="final"/>`. En JSON el valor es directo.
2. Los arrays JSON se representan **repitiendo la etiqueta**: dos nombres = dos `<name>...</name>` seguidos.
3. En XML el tipo de recurso es la **etiqueta raíz** (`<Observation>`) con el namespace `xmlns="http://hl7.org/fhir"`; en JSON es el campo `resourceType`. Y en XML el orden de los elementos importa (sigue el orden de la especificación); en JSON no.

Al pedirle formato al servidor, el MIME type oficial es `application/fhir+json` o `application/fhir+xml` (lo verás en el Tema 2 con las cabeceras HTTP).

### Errores comunes

- Escribir `name.family` olvidando el índice: `name` es array, necesitas `name[0]`.
- Contar índices desde 1: en JSON empiezan en **0**.
- Buscar el valor de `<status>` como texto interno del tag XML: está en el atributo `value`.
- Asumir que `text` de un CodeableConcept siempre existe: casi todo en FHIR es opcional; programa a la defensiva.
- Confundir `id` (técnico, del servidor) con `identifier` (del mundo real, con system+value).

## Chuleta

| Cosa | Cómo se ve / regla |
|------|--------------------|
| Objeto | `{ "clave": valor }` — agrupa campos |
| Array | `[ ... ]` — lista; índices desde 0 |
| Tipo de recurso | JSON: `"resourceType"` · XML: etiqueta raíz |
| Ruta apellido | `Patient.name[0].family` |
| Ruta 1er nombre | `Patient.name[0].given[0]` |
| Código LOINC | `Observation.code.coding[0].code` |
| Valor medido | `Observation.valueQuantity.value` |
| Paciente dueño | `Observation.subject.reference` → `"Patient/123"` |
| CodeableConcept | `coding` (máquinas) + `text` (humanos) |
| Coding | `system` + `code` + `display` |
| XML primitivos | valor en atributo: `<status value="final"/>` |
| XML arrays | etiqueta repetida |
| MIME types | `application/fhir+json` · `application/fhir+xml` |

## Autoevaluación (sin mirar arriba)

1. ¿Por qué `name` va entre corchetes `[ ]` aunque el paciente tenga un solo nombre?
2. Escribe la ruta exacta para el primer nombre de pila de un Patient.
3. En un CodeableConcept, ¿para qué sirve `coding` y para qué sirve `text`?
4. ¿Dónde está el valor de un elemento primitivo en XML FHIR y dónde en JSON?
5. ¿Qué diferencia hay entre `Patient.id` y `Patient.identifier`?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 1 JSON y XML".
2. Añade estos enlaces oficiales como fuentes:
   - http://hl7.org/fhir/R4/datatypes.html — todos los tipos de dato R4 (CodeableConcept, Quantity, Identifier…).
   - http://hl7.org/fhir/R4/resourcelist.html — lista completa de recursos; útil para ver más ejemplos JSON.
   - http://hl7.org/fhir/R4/ — raíz de la especificación R4; contexto general.
   - http://hl7.org/fhir/overview.html — introducción oficial que conecta formatos con la filosofía de recursos.
3. Prompts sugeridos:
   - "Muéstrame un JSON de Observation y hazme preguntas de rutas (tipo Observation.code.coding[0].code) hasta que acierte 5 seguidas."
   - "Compara en tabla cómo se representa el mismo Patient en JSON y en XML FHIR, destacando el atributo value y los arrays."
   - "Hazme un examen oral sobre CodeableConcept, Coding, Quantity, Reference e Identifier: definición, ejemplo y error común de cada uno."

---

### Respuestas

1. Porque su cardinalidad permite varios nombres (oficial, de soltera, apodo); en JSON todo elemento repetible es array aunque tenga un solo ítem.
2. `Patient.name[0].given[0]`.
3. `coding` lleva códigos formales (system+code) para que las máquinas comparen; `text` conserva el texto legible que vio/escribió el humano.
4. En XML va en el atributo `value` de la etiqueta (`<status value="final"/>`); en JSON el valor es directo (`"status": "final"`).
5. `id` es el identificador técnico del recurso dentro de ese servidor (parte de la URL); `identifier` son identificadores del mundo real (DUI, expediente) con `system` y `value`.
