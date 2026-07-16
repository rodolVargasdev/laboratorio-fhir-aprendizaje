# JSON y XML: la representación de recursos FHIR

> **En simple:** todo recurso FHIR es una estructura de datos con reglas estrictas: un tipo (`resourceType`), un identificador, metadatos, y campos cuyos tipos y cardinalidades fija la especificación. Este tema te lleva de "leer JSON" a dominar la representación FHIR completa: tipos primitivos y sus trampas, el patrón `_propiedad`, los choice types `value[x]`, el XML equivalente (el examen espera que leas ambos), la narrativa y los recursos contenidos.

## Anatomía de un recurso: resourceType, id, meta, narrative y contained

Un recurso FHIR en JSON es un objeto cuyo primer nivel siempre puede contener estas piezas:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo-1",
  "meta": {
    "versionId": "3",
    "lastUpdated": "2026-07-10T14:22:05.331Z",
    "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"],
    "security": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-Confidentiality", "code": "R" }],
    "tag": [{ "system": "https://salud.gob.sv/tags", "code": "carga-inicial" }]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">Maria Hernandez, F, 1985-04-12</div>"
  }
}
```

- **`resourceType`**: presente en todo recurso JSON; dice qué tipo es. En XML no existe: el tipo es la etiqueta raíz.
- **`id`**: el **id lógico** del recurso en ESE servidor. Forma parte de la URL (`[base]/Patient/ejemplo-1`). Lo asigna el servidor (en create) y no cambia entre versiones. No lo confundas con `identifier` (identificadores del mundo real: DUI, expediente) ni con el `versionId`.
- **`meta`**: metadatos gestionados en gran parte por el servidor:
  - `versionId`: cambia con cada actualización; aparece en la URL de vread (`.../_history/3`) y en el header `ETag`.
  - `lastUpdated`: tipo `instant`, momento del último cambio.
  - `profile`: URLs canónicas de perfiles que la instancia **declara** cumplir. Ojo: declarar no es cumplir; la validación lo comprueba.
  - `security`: etiquetas de seguridad (confidencialidad, restricciones).
  - `tag`: etiquetas de proceso sin semántica clínica (lotes, orígenes).
- **`text` (Narrative)**: el resumen legible por humanos. Tiene `status` (`generated` = derivado del contenido estructurado; `extensions` = incluye datos de extensiones; `additional` = contiene información que NO está en los datos estructurados; `empty`) y `div`, un fragmento **XHTML** (incluso en JSON, el `div` es XML embebido con namespace `http://www.w3.org/1999/xhtml`). La narrativa importa: es la red de seguridad clínica cuando el receptor no entiende toda la estructura.

### contained: recursos sin vida propia

Cuando un recurso solo tiene sentido dentro de otro (un medicamento improvisado que nadie más referenciará), puede ir **contenido**:

```json
{
  "resourceType": "MedicationRequest",
  "id": "mr-1",
  "contained": [
    { "resourceType": "Medication", "id": "med1",
      "code": { "text": "Preparado magistral X" } }
  ],
  "status": "active",
  "intent": "order",
  "medicationReference": { "reference": "#med1" },
  "subject": { "reference": "Patient/123" }
}
```

Reglas de examen sobre contained: se referencia con `#id` (referencia interna); un contained **no puede contener** otros contained; **no lleva** `meta.versionId` ni `meta.lastUpdated` propios; no es direccionable por URL (no existe `GET [base]/Medication/med1`); y debe estar referenciado desde el recurso contenedor (o referenciarlo). Si el dato merece existencia propia, no lo contengas: créalo como recurso normal y referéncialo.

## Tipos primitivos: las reglas que el examen explota

FHIR define sus propios primitivos sobre JSON/XML, con reglas más estrictas que las del formato base.

| Tipo FHIR | Regla esencial | Ejemplo |
|-----------|----------------|---------|
| `boolean` | `true`/`false` JSON | `"active": true` |
| `integer` / `positiveInt` / `unsignedInt` | número JSON sin comillas | `"rank": 1` |
| `decimal` | número JSON; la **precisión es significativa** (2.0 no equivale semánticamente a 2.00); no procesar como float binario | `"value": 72.5` |
| `string` | hasta 1 MB; no debe ser solo espacios | `"family": "Hernandez"` |
| `code` | string tomado de un conjunto controlado; sin espacios líderes/trailing | `"gender": "female"` |
| `id` | `[A-Za-z0-9\-\.]{1,64}`: letras, dígitos, guion y punto, máx. 64 | `"id": "ejemplo-1"` |
| `uri` | identificador uniforme general; sensible a mayúsculas | `"system": "http://loinc.org"` |
| `url` | uri que además es dirección accesible | endpoint de un servicio |
| `canonical` | uri que referencia recursos canónicos (perfiles, ValueSets) y admite versión con `\|`: `...us-core-patient\|7.0.0` | `meta.profile` |
| `date` | `AAAA`, `AAAA-MM` o `AAAA-MM-DD` (precisión parcial permitida); **sin hora ni zona** | `"birthDate": "1985-04-12"` |
| `dateTime` | fecha con hora opcional; **si incluye hora, la zona horaria es obligatoria** | `"2026-07-10T08:30:00-06:00"` |
| `instant` | momento exacto: fecha + hora al menos a segundos + zona **siempre obligatorias**; para timestamps de sistema | `meta.lastUpdated` |
| `time` | hora del día sin fecha ni zona | `"08:30:00"` |
| `base64Binary` | contenido binario codificado | adjuntos |
| `markdown` | string con formato markdown | `"comment"` en varios recursos |

Distinciones que caen en examen:

- **`date` vs `dateTime` vs `instant`**: `date` admite precisión parcial y nunca lleva hora; `dateTime` admite parciales y exige zona horaria cuando hay hora; `instant` no admite parciales (es un timestamp de máquina). `Patient.birthDate` es `date`; `Observation.effectiveDateTime` es `dateTime`; `meta.lastUpdated` es `instant`.
- **`uri` vs `url` vs `canonical`**: toda `url` es `uri`, pero no al revés (`urn:oid:...` es uri, no url). `canonical` apunta a la URL canónica de un artefacto de conformidad y puede llevar `|versión`.
- **`decimal`**: los sistemas serios lo procesan con aritmética decimal (BigDecimal), no float, porque en dosis y resultados la precisión escrita comunica significado clínico.

### El patrón _propiedad: extensiones sobre primitivos

En JSON, un primitivo es un valor pelado (`"birthDate": "1985"`): no hay dónde colgarle una extensión o un id de elemento. FHIR lo resuelve con una **propiedad hermana** prefijada con guion bajo:

```json
{
  "birthDate": "1985",
  "_birthDate": {
    "extension": [{
      "url": "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
      "valueDateTime": "1985-04-12T05:30:00-06:00"
    }]
  }
}
```

`_birthDate` transporta lo que en XML iría dentro del elemento (`<birthDate value="1985"><extension...>`). Reglas: puede existir `_propiedad` incluso sin la propiedad (valor desconocido pero extensión presente); y en **arrays de primitivos**, el array `_propiedad` corre en paralelo posición a posición, usando `null` para alinear las posiciones sin extensión — el único lugar de FHIR JSON donde `null` es legal:

```json
{
  "given": ["Maria", "Jose"],
  "_given": [null, { "extension": [ { "url": "https://example.org/x", "valueBoolean": true } ] }]
}
```

## Tipos complejos, choice types y cardinalidad

### Los complejos que se repiten en todo el estándar

- **Coding**: un código de un sistema: `{ "system": "http://loinc.org", "code": "8867-4", "display": "Heart rate" }`. `system` es la URI del sistema de códigos, `code` el símbolo para máquinas, `display` el texto oficial.
- **CodeableConcept**: `coding[]` (el mismo concepto puede venir codificado en LOINC Y SNOMED CT a la vez) + `text` (lo que el humano vio o escribió). Contraste de examen: un elemento tipo `code` lleva un valor pelado de un conjunto fijo; un `CodeableConcept` es la estructura completa.
- **Quantity**: `value` (decimal), `unit` (texto legible), `system` + `code` (unidad formal, casi siempre UCUM: `http://unitsofmeasure.org`), `comparator` opcional (`<`, `<=`, `>=`, `>`: "menos de 5").
- **Identifier**: identificador del mundo real: `system` (el espacio de identificación, p. ej. `https://salud.gob.sv/identificadores/dui`) + `value` (el número), más `use` y `type`. La dupla system+value debe ser única en el mundo.
- **Reference**: cómo un recurso apunta a otro: `{ "reference": "Patient/123", "display": "Maria Hernandez" }`. Puede ser relativa (`Patient/123`), absoluta (`https://otro-servidor/fhir/Patient/9`), interna (`#med1`) o **lógica** (solo `identifier`, cuando no conoces la URL).
- **HumanName** (`use`, `family` string, `given[]`), **Address**, **ContactPoint** (`system`: phone/email..., `value`, `use`), **Period** (`start`, `end`, ambos dateTime), **Range**, **Ratio**, **Annotation**, **Attachment**.

### Choice types: value[x]

Muchos elementos aceptan varios tipos alternativos. La especificación los escribe con `[x]` (p. ej. `Observation.value[x]`) y la instancia usa el nombre del elemento + el tipo con inicial mayúscula:

- `valueQuantity`, `valueCodeableConcept`, `valueString`, `valueBoolean`, `valueDateTime`...
- `effective[x]` -> `effectiveDateTime` o `effectivePeriod`; `medication[x]` -> `medicationCodeableConcept` o `medicationReference`; `deceased[x]` -> `deceasedBoolean` o `deceasedDateTime`.

Reglas duras: **solo UNA** variante puede estar presente en una instancia (nunca `valueQuantity` y `valueString` a la vez); los choice **no se repiten** (cardinalidad máxima 1 en el elemento `[x]`); y el sufijo es exactamente el nombre del tipo capitalizado (`valueCodeableConcept`, no `valueCodeableconcept`). En el examen te mostrarán instancias con dos `value[x]` simultáneos o con sufijos mal escritos: ambas son inválidas.

### Arrays y cardinalidad

La especificación fija cardinalidad `min..max` por elemento. Regla JSON: si el máximo es `*` (repetible), el elemento **siempre** se representa como array, aunque traiga un solo ítem (`"name": [ {...} ]`); si el máximo es 1, nunca es array. Por eso `Patient.name` es array (0..*) y `Patient.birthDate` no (0..1). Corolario: `name.family` no existe como ruta; es `name[0].family` (índices desde 0). Y en FHIR casi todo es opcional (min 0): programa a la defensiva; son los **perfiles** los que endurecen cardinalidades.

## XML: el segundo formato oficial

El examen espera que **leas** ambos formatos. El mismo contenido, en XML:

```xml
<Patient xmlns="http://hl7.org/fhir">
  <id value="ejemplo-1"/>
  <meta>
    <versionId value="3"/>
    <lastUpdated value="2026-07-10T14:22:05.331Z"/>
  </meta>
  <text>
    <status value="generated"/>
    <div xmlns="http://www.w3.org/1999/xhtml">Maria Hernandez, F, 1985-04-12</div>
  </text>
  <identifier>
    <system value="https://salud.gob.sv/identificadores/dui"/>
    <value value="01234567-8"/>
  </identifier>
  <name>
    <use value="official"/>
    <family value="Hernandez"/>
    <given value="Maria"/>
    <given value="Jose"/>
  </name>
  <gender value="female"/>
  <birthDate value="1985-04-12">
    <extension url="http://hl7.org/fhir/StructureDefinition/patient-birthTime">
      <valueDateTime value="1985-04-12T05:30:00-06:00"/>
    </extension>
  </birthDate>
</Patient>
```

Reglas para leerlo sin sufrir:

1. **El tipo de recurso es la etiqueta raíz** con el namespace `xmlns="http://hl7.org/fhir"`. No hay `resourceType`.
2. **Los primitivos van en el atributo `value=`** de su elemento: `<gender value="female"/>`. El texto interno del tag NO se usa (excepto en el `div`).
3. **Los repetibles se representan repitiendo la etiqueta**: dos `given` = dos `<given>`. No existe sintaxis de array.
4. **El orden de los elementos importa** en XML (sigue el orden de la especificación); en JSON el orden de propiedades es irrelevante.
5. **Las extensiones son elementos hijos** con atributo `url`, dentro del elemento extendido: no existe el patrón `_propiedad` (es un artefacto exclusivo de JSON).
6. **El `div` de la narrativa cambia de namespace** a XHTML (`http://www.w3.org/1999/xhtml`).

| Aspecto | JSON | XML |
|---------|------|-----|
| Tipo de recurso | propiedad `resourceType` | etiqueta raíz + namespace FHIR |
| Primitivos | valor directo | atributo `value=` |
| Repetición | array `[ ]` | etiqueta repetida |
| Orden de elementos | irrelevante | significativo |
| Extensión de primitivos | `_propiedad` hermana | hijos dentro del elemento |
| Narrativa `div` | string con XHTML escapado | XHTML nativo con su namespace |
| `null` | prohibido salvo alineación en arrays `_prop` | no existe |
| MIME type | `application/fhir+json` | `application/fhir+xml` |

## Un Patient completo, campo a campo

```json
{
  "resourceType": "Patient",                        // tipo: obligatorio en JSON
  "id": "sv-000123",                                // id lógico en este servidor
  "meta": {
    "versionId": "2",                               // versión actual (vread, ETag)
    "lastUpdated": "2026-07-01T10:15:00.000Z",      // instant: zona obligatoria
    "profile": ["https://salud.gob.sv/fhir/StructureDefinition/paciente-sv"]
  },
  "text": {
    "status": "generated",                          // derivada de los datos
    "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">Maria Jose Hernandez, F, 12/04/1985</div>"
  },
  "identifier": [{                                  // del mundo real (≠ id)
    "use": "official",
    "system": "https://salud.gob.sv/identificadores/dui",
    "value": "01234567-8"
  }],
  "active": true,                                   // boolean primitivo
  "name": [{                                        // 0..* -> siempre array
    "use": "official",
    "family": "Hernandez",                          // string simple
    "given": ["Maria", "Jose"]                      // array de primitivos
  }],
  "telecom": [{ "system": "phone", "value": "+503 7000-0000", "use": "mobile" }],
  "gender": "female",                               // code: male|female|other|unknown
  "birthDate": "1985-04-12",                        // date: sin hora ni zona
  "deceasedBoolean": false,                         // choice deceased[x]: solo UNA variante
  "address": [{ "use": "home", "city": "San Salvador", "country": "SV" }],
  "maritalStatus": {                                // CodeableConcept
    "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus", "code": "M" }],
    "text": "Casada"
  },
  "managingOrganization": { "reference": "Organization/minsal", "display": "MINSAL" }
}
```

(Los comentarios `//` son didácticos: JSON real no admite comentarios; si los envías, el servidor responde 400.)

Puntos que el examen mira con lupa: `gender` es un `code` administrativo con binding required (male | female | other | unknown), no el sexo clínico; `deceasedBoolean`/`deceasedDateTime` es choice excluyente; `identifier.system` + `identifier.value` identifican en el mundo real mientras `id` solo identifica en ese servidor; y `meta.profile` declara conformidad, no la demuestra.

## Errores comunes y gotchas

- **Tratar `id` e `identifier` como sinónimos.** `id` = id lógico técnico en la URL del servidor; `identifier` = identificadores del mundo real con system+value. Migrar de servidor cambia el `id`, no el `identifier`.
- **Dos variantes de un choice a la vez** (`valueQuantity` + `valueString`): instancia inválida. También lo es el sufijo mal capitalizado.
- **Olvidar que los repetibles son arrays con un solo ítem**: `"name": { ... }` es inválido si la cardinalidad es 0..*; la ruta `name.family` no existe, es `name[0].family`.
- **Usar `null` en JSON FHIR**: prohibido, salvo la alineación posicional en arrays `_propiedad`. "Sin valor" = omitir la propiedad.
- **`dateTime` con hora pero sin zona horaria**: inválido. `2026-07-10T08:30:00` a secas no pasa validación; `2026-07-10` sí (precisión parcial).
- **Buscar el valor XML como texto interno del tag**: está en el atributo `value=`. El texto interno solo se usa en el `div` XHTML.
- **Asumir que el orden de elementos JSON importa** (no importa) **o que el de XML no importa** (sí importa).
- **Confundir `code` con `Coding` con `CodeableConcept`**: valor pelado vs (system, code, display) vs (coding[] + text).
- **Creer que `meta.profile` garantiza conformidad**: es una declaración; la validación contra el StructureDefinition es lo que la comprueba.
- **Enviar JSON con comentarios o comas colgantes**: 400 Bad Request; FHIR usa JSON estricto.

## Nivel experto

- **decimal y los floats**: si tu pipeline deserializa `1.50` a float y reserializa `1.5`, cambiaste la precisión y, con ella, información clínica implícita (la precisión del instrumento). Las bibliotecas FHIR serias (HAPI, Firely) usan tipos decimales con preservación de precisión. Audita esto en integraciones nacionales: es un bug silencioso típico.
- **Igualdad de URIs**: `system: "http://loinc.org"` y `"http://LOINC.org"` NO son el mismo sistema para un comparador conforme (las URI son sensibles a mayúsculas salvo esquema y host según RFC, pero FHIR manda comparación exacta de cadenas para `system`). Normaliza en origen, no en destino.
- **La narrativa como contrato clínico-legal**: `text.status = additional` significa que el `div` contiene información que NO está en los campos estructurados; un consumidor que ignore la narrativa en ese caso está perdiendo contenido clínico. Política sensata de plataforma: generar siempre narrativa (`generated`) y prohibir `additional` en perfiles nacionales salvo casos justificados.
- **XHTML del `div` y seguridad**: el `div` admite un subconjunto restringido de XHTML (sin scripts, sin iframes, sin atributos de evento), pero igualmente es contenido de terceros que tu frontend renderiza: sanitízalo SIEMPRE (riesgo XSS real en portales de paciente).
- **contained vs referencia: decisión de arquitectura**: contener simplifica el intercambio puntual pero rompe la direccionabilidad (no puedes buscar ni versionar el contenido por separado) y duplica datos si el mismo concepto reaparece. Regla operativa: contained solo cuando el recurso interno no tiene identidad propia fuera del contenedor.
- **JSON y XML deben ser convertibles sin pérdida**: la especificación exige representaciones lógicamente equivalentes (round-trip). Si tu middleware "aplana" el `_propiedad` o pierde extensiones al convertir, deja de ser conforme. Prueba de fuego en integraciones: convertir JSON->XML->JSON y comparar.
- **R5/R6**: la representación JSON/XML es de lo más estable del estándar (normativa desde R4). Los cambios de versión afectan qué campos existen, no cómo se serializan; tu inversión en este tema sobrevive a los saltos de versión.

## Chuleta

| Cosa | Regla |
|------|-------|
| `resourceType` | Solo JSON; en XML el tipo es la etiqueta raíz + `xmlns="http://hl7.org/fhir"` |
| `id` vs `identifier` | id lógico del servidor (URL) vs identificador del mundo real (system+value) |
| `meta` | versionId, lastUpdated (instant), profile (canonical), security, tag |
| Narrative | `text.status` (generated/extensions/additional/empty) + `text.div` XHTML |
| contained | referencia `#id`; sin versionId/lastUpdated; no anidable; no direccionable |
| `date` | AAAA[-MM[-DD]]; sin hora ni zona |
| `dateTime` | parciales OK; con hora -> zona horaria obligatoria |
| `instant` | timestamp completo con zona, siempre |
| uri / url / canonical | identificador / dirección accesible / referencia a canónicos con `\|versión` |
| `id` (tipo) | `[A-Za-z0-9\-\.]{1,64}` |
| `_propiedad` | extensiones/id de primitivos en JSON; en arrays corre en paralelo con `null` de relleno |
| value[x] | una sola variante; sufijo = tipo capitalizado (valueQuantity) |
| Repetibles | siempre array en JSON aunque haya 1; etiqueta repetida en XML |
| XML primitivos | atributo `value=`; orden de elementos significativo |
| code / Coding / CodeableConcept | valor pelado / system+code+display / coding[]+text |
| MIME | `application/fhir+json` · `application/fhir+xml` |

## Autoevaluacion

1. ¿Qué diferencias hay entre `Patient.id`, `Patient.identifier` y `Patient.meta.versionId`?
2. ¿Cuál de estos valores es un `dateTime` R4 válido y por qué: `1985`, `2026-07-10T08:30:00`, `2026-07-10T08:30:00-06:00`?
3. Explica el patrón `_birthDate` en JSON: qué transporta y cómo se representa lo mismo en XML.
4. Un recurso trae `"valueQuantity": {...}` y `"valueString": "alto"`. ¿Es válido? ¿Qué regla aplica?
5. ¿Cómo se representa en XML el array JSON `"given": ["Maria", "Jose"]`?
6. ¿Qué significa `text.status = "additional"` y qué implica para un consumidor?
7. ¿Qué reglas cumple un recurso `contained` y cuándo NO deberías usar contained?
8. Da la ruta exacta del código LOINC de la primera codificación del código de una Observation.

### Respuestas

1. `id`: id lógico del recurso en ese servidor (parte de la URL, estable entre versiones). `identifier`: identificadores del mundo real (system + value, p. ej. DUI), sobreviven a migraciones de servidor. `meta.versionId`: la versión concreta de la instancia; cambia con cada update y aparece en vread y ETag.
2. `1985` es válido como dateTime (precisión parcial permitida). `2026-07-10T08:30:00` es INVÁLIDO: si hay hora, la zona horaria es obligatoria. `2026-07-10T08:30:00-06:00` es válido y completo.
3. `_birthDate` es la propiedad hermana que transporta id y extensiones del primitivo `birthDate`, porque el valor JSON pelado no puede contenerlos. En XML no hace falta: las extensiones van como elementos hijos dentro de `<birthDate value="...">`.
4. Inválido: `value[x]` es un choice type y solo una variante puede estar presente en la instancia. La regla aplica a todo elemento `[x]` (effective[x], deceased[x], medication[x]...).
5. Repitiendo la etiqueta: `<given value="Maria"/><given value="Jose"/>`. XML no tiene sintaxis de array; la repetición del elemento la sustituye.
6. Que la narrativa contiene información clínica que NO está en los datos estructurados. Un consumidor que ignore el `div` en ese caso pierde contenido; por eso muchos perfiles nacionales restringen o prohíben `additional`.
7. Se referencia con `#id`; no lleva meta.versionId/lastUpdated; no puede anidar otros contained; no es direccionable por URL propia; debe estar vinculado al contenedor. No lo uses cuando el dato tiene identidad propia (necesita búsqueda, versionado o reutilización): en ese caso, recurso independiente + Reference.
8. `Observation.code.coding[0].code`.

## Para profundizar

- [Tipos de datos R4](http://hl7.org/fhir/R4/datatypes.html) — la página que este tema resume: cada primitivo con su regex y cada complejo con su estructura; imprescindible.
- [Representación JSON R4](http://hl7.org/fhir/R4/json.html) — las reglas exactas de serialización JSON, incluido `_propiedad` y el manejo de null.
- [Representación XML R4](http://hl7.org/fhir/R4/xml.html) — el espejo XML: atributo value, orden, namespaces.
- [Narrative R4](http://hl7.org/fhir/R4/narrative.html) — estados de la narrativa y el subconjunto XHTML permitido en el div.
- [Extensibilidad R4](http://hl7.org/fhir/R4/extensibility.html) — cómo funcionan las extensiones que el patrón _propiedad transporta.
- [Recurso Patient R4](http://hl7.org/fhir/R4/patient.html) — el recurso del ejemplo completo; revisa su tabla de elementos y cardinalidades.
- [Lista de recursos R4](http://hl7.org/fhir/R4/resourcelist.html) — para practicar lectura de definiciones con otros recursos.
