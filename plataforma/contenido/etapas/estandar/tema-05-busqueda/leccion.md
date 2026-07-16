# Búsqueda avanzada

> **En simple:** la búsqueda FHIR es un lenguaje de consulta sobre HTTP: cada parámetro tiene un tipo (token, date, reference...) que dicta su sintaxis exacta, sus prefijos y sus modificadores. Dominar ese sistema — más chaining, `_has`, `_include` y la paginación — es el corazón del dominio API Behavior (26 % del examen) y la habilidad diaria número uno de un implementador.

## El marco: parámetros de búsqueda y sus nueve tipos

Una búsqueda es `GET [base]/[Tipo]?param=valor&param2=valor2`. Los parámetros repetidos o distintos se combinan con **AND**; los valores separados por coma dentro de un parámetro son **OR**. Cada parámetro de búsqueda está **declarado** (en la especificación o en el CapabilityStatement del servidor) con uno de nueve tipos, y el tipo define la sintaxis:

| Tipo | Contra qué elementos | Ejemplo |
|---|---|---|
| `number` | Números | `RiskAssessment?probability=gt0.8` |
| `date` | date, dateTime, instant, Period, Timing | `Patient?birthdate=ge1990-01-01` |
| `string` | string, HumanName, Address | `Patient?name=per` (por defecto: empieza-por, insensible a mayúsculas y acentos) |
| `token` | code, Coding, CodeableConcept, Identifier, boolean | `Observation?code=http://loinc.org|8867-4` |
| `reference` | Reference | `Observation?subject=Patient/123` |
| `composite` | Pares correlacionados | `Observation?code-value-quantity=8480-6$gt140` |
| `quantity` | Quantity | `Observation?value-quantity=gt5.4|http://unitsofmeasure.org|mg` |
| `uri` | uri, canonical | `ValueSet?url=http://hl7.org/fhir/ValueSet/observation-status` |
| `special` | Casos ad hoc | `Location?near=...` |

Detalle de examen: `string` busca "empieza por" tras normalizar; `token` busca **igualdad exacta** del código dentro de su sistema. Por eso `Patient?name=ana` encuentra "Ana María", pero `Patient?gender=mal` no encuentra `male`.

Importante: el nombre del parámetro **no** es el nombre del elemento. `Patient?birthdate=...` funciona porque existe el SearchParameter `birthdate` (definido sobre el elemento `Patient.birthDate`). Los parámetros soportados por un servidor se declaran en su CapabilityStatement (`rest.resource.searchParam`).

### Token: las cuatro formas

Un valor token `system|code` admite exactamente cuatro variantes:

1. `code` — ese código en **cualquier** sistema: `Observation?code=8867-4`
2. `system|code` — el código dentro de ese sistema: `code=http://loinc.org|8867-4` (la forma segura)
3. `|code` — código en elementos **sin** `system` declarado
4. `system|` — cualquier código de ese sistema: `code=http://loinc.org|` ("todo lo LOINC")

## Prefijos, fechas y modificadores

Los tipos ordenados (number, date, quantity) aceptan prefijos: `eq ne gt lt ge le sa eb ap`.

La sutileza que decide preguntas de examen: **un valor de fecha es un rango implícito según su precisión**. `2026` significa [2026-01-01T00:00:00 … 2026-12-31T23:59:59]; `2026-07` cubre todo julio. Los prefijos comparan **rangos contra rangos** (el dato del recurso también puede ser un rango: un Period, o un dateTime con menos precisión):

- `eq` — el rango del recurso está **contenido** en el rango del parámetro. `birthdate=eq2026` matchea cualquier fecha de 2026.
- `ne` — lo contrario de eq.
- `gt` / `lt` — **alguna parte** del rango del recurso cae después / antes del rango del parámetro.
- `ge` / `le` — como gt/lt, incluyendo solape con el propio rango.
- `sa` (starts after) — el rango del recurso **empieza después de que termina** el del parámetro. `eb` (ends before) — termina antes de que empiece. A diferencia de gt/lt, exigen separación total: un Period abierto que solapa no matchea.
- `ap` — aproximado; el margen lo decide el servidor (sugerencia: ±10 % del intervalo).

Ejemplo: `Encounter?date=sa2026-01-01&date=eb2027-01-01` exige encuentros estrictamente dentro de 2026, sin solaparse con los bordes; con `ge`/`lt` aceptarías encuentros que empezaron antes y siguen abiertos.

### Modificadores por tipo

Se escriben con dos puntos tras el nombre: `param:modificador=valor`.

| Modificador | Tipos | Efecto |
|---|---|---|
| `:exact` | string | Igualdad exacta, sensible a mayúsculas y acentos |
| `:contains` | string | Subcadena en cualquier posición |
| `:missing` | todos | `=true`: el elemento está ausente; `=false`: presente. `Patient?birthdate:missing=true` |
| `:text` | token, string | Busca sobre el texto/display asociado: `Condition?code:text=hipertension` |
| `:not` | token | Negación: `Observation?status:not=entered-in-error`. Ojo: también matchea recursos donde el elemento falta |
| `:in` / `:not-in` | token | El código pertenece (o no) a un **ValueSet**: `Condition?code:in=http://ejemplo.sv/ValueSet/cronicas` |
| `:below` / `:above` | token, uri | Jerarquía: descendientes/ancestros por subsunción; en uri, relación de prefijo |
| `:of-type` | token (solo Identifier) | `Patient?identifier:of-type=http://terminology.hl7.org/CodeSystem/v2-0203|MR|12345` (system y code del type + valor, unidos por `|`) |
| `:identifier` | reference | Busca por la referencia lógica: `Observation?subject:identifier=https://fhir.gob.sv/id/dui|01234567-8` |
| `:[Tipo]` | reference | Restringe el tipo destino: `Observation?subject:Patient=123` |

## Búsqueda por referencia, chaining y _has

Un parámetro reference acepta: `id` a secas (`subject=123`, ambiguo si el parámetro admite varios tipos destino), `Tipo/id` (`subject=Patient/123`) o una URL absoluta.

### Chaining (encadenamiento hacia adelante)

Con `.` cruzas al recurso referenciado y filtras por **sus** parámetros de búsqueda:

```http
GET [base]/Observation?subject.name=ana
```

"Observations cuyo subject tiene nombre que empieza por ana". Si el parámetro admite varios tipos destino, **tipifica la cadena**: `Observation?subject:Patient.name=ana`. El chaining puede ser múltiple (varios eslabones):

```http
GET [base]/Observation?patient.general-practitioner.name=lopez
```

Cada eslabón debe ser un parámetro de búsqueda del recurso intermedio, no un nombre de elemento.

### Reverse chaining: `_has`

`_has` selecciona recursos según **quién los referencia**. Sintaxis: `_has:TipoQueReferencia:paramDeReferencia:paramCriterio=valor`.

```http
GET [base]/Patient?_has:Observation:patient:code=8867-4
```

"Pacientes que son referenciados por alguna Observation (vía su parámetro `patient`) cuyo código es 8867-4". Se puede anidar (doble `_has`):

```http
GET [base]/Patient?_has:Observation:patient:_has:AuditEvent:entity:agent=Practitioner/9
```

"Pacientes con observaciones que aparecen como entity en AuditEvents cuyo agente es el practicante 9". Léelo de fuera hacia adentro.

### Composite

Cuando dos criterios deben cumplirse **en la misma repetición** de un elemento, se usa un parámetro composite con `$` separando los componentes:

```http
GET [base]/Observation?component-code-value-quantity=http://loinc.org|8480-6$gt140
```

"Observations con un component cuyo code es 8480-6 **y ese mismo component** tiene valueQuantity > 140" (sistólica alta). Escribir `component-code=...&component-value-quantity=...` es distinto: matchearía recursos donde un componente aporta el código y **otro** el valor.

## Parámetros de resultado y contextos

Controlan qué devuelve el servidor, no qué coincide:

- **`_sort`**: parámetros separados por coma; prefijo `-` para descendente: `Observation?_sort=-date,code`.
- **`_count`**: máximo de recursos **match** por página. `_count=0` combinado con `_total` sirve para pedir solo el conteo.
- **`_total`**: `none` | `estimate` | `accurate` — cuánto esfuerzo invierte el servidor en calcular `Bundle.total`.
- **`_summary`**: `true` (solo elementos marcados como summary), `text` (narrativa + mínimos), `data` (todo menos narrativa), `count` (solo el total), `false` (todo).
- **`_elements`**: proyección de campos: `Patient?_elements=name,birthdate`. Los recursos recortados se marcan con el tag SUBSETTED.
- **`_include`**: incluir los recursos que las coincidencias **referencian**: `MedicationRequest?_include=MedicationRequest:medication`. Formato `Tipo:parametro[:TipoDestino]`.
- **`_revinclude`**: incluir los recursos que **referencian** a las coincidencias: `Patient?_revinclude=Observation:patient`.
- **`:iterate`**: aplica el include también sobre los recursos ya incluidos (transitividad): `Observation?_include=Observation:subject&_include:iterate=Patient:general-practitioner`.
- **`_contained`**: controla si los recursos contenidos aparecen en los resultados.

En el Bundle searchset cada entrada declara `search.mode`: `match` (coincidió con los criterios) o `include` (llegó por _include/_revinclude). `_count` limita los match, no los include.

### Parámetros comunes a todos los recursos

`_id` (búsqueda por id lógico — útil combinada con `_include` o `_revinclude`), `_lastUpdated` (con prefijos de fecha), `_tag`, `_profile` (recursos que **afirman** un perfil en meta.profile), `_security`, `_text` y `_content` (texto libre sobre narrativa / recurso completo), `_filter` (lenguaje de filtros avanzado, soporte opcional; en el examen basta reconocerlo).

### Contextos de búsqueda y quantity

La búsqueda no vive solo en `[base]/[Tipo]`. Hay tres contextos:

- **Tipo**: `GET [base]/Observation?...` — el habitual.
- **Sistema**: `GET [base]?_type=Patient,Practitioner&_content=garcia` — búsqueda a través de varios tipos (los parámetros usados deben existir en todos los tipos implicados; sin `_type`, aplican solo los parámetros comunes `_id`, `_lastUpdated`...).
- **Compartimento**: `GET [base]/Patient/123/Observation?code=8867-4` — busca Observations **dentro del compartimento** del paciente 123. Equivale conceptualmente a `Observation?patient=123&code=8867-4` y es la base de APIs orientadas a paciente (SMART on FHIR).

El tipo `quantity` merece su sintaxis completa: `valor|sistema|código`, con prefijos:

```http
GET [base]/Observation?value-quantity=gt140|http://unitsofmeasure.org|mm[Hg]
```

"Valor mayor que 140 mm[Hg] en UCUM". Se puede omitir sistema y código (`value-quantity=gt140`) para comparar solo el número, o dar `valor||código` para el código sin fijar sistema. Un servidor avanzado puede normalizar unidades UCUM (comparar 1 g con 1000 mg); no lo asumas: pruébalo.

Recuerda también que los resultados de búsqueda **no son transaccionales con la escritura**: tras un create, el índice puede tardar en reflejarlo según la arquitectura del servidor. Para lecturas inmediatas usa el `Location` devuelto por el POST, no una búsqueda.

## Paginación y ejecución

El servidor responde un searchset con `Bundle.link`:

```json
"link": [
  { "relation": "self", "url": "https://hapi.fhir.org/baseR4/Observation?code=8867-4&_count=20" },
  { "relation": "next", "url": "https://hapi.fhir.org/baseR4?_getpages=b64c8a...&_getpagesoffset=20&_count=20" }
]
```

Regla de oro: **el enlace `next` es opaco**. No construyas URLs de página a mano; su formato es interno del servidor (cursores, resultados materializados con expiración) y puede no parecerse a tu consulta original. El cliente correcto sigue `next` hasta que desaparezca. `Bundle.total` — cuando existe — es el total de matches de toda la búsqueda, no el tamaño de la página.

**POST _search**: `POST [base]/Patient/_search` con cuerpo `application/x-www-form-urlencoded`. Mismos parámetros; útil cuando la URL sería demasiado larga o cuando no quieres identificadores sensibles en URLs que terminan en logs y proxies.

**Parámetros desconocidos**: por defecto el servidor puede **ignorarlos** (manejo lenient) y ejecutar la búsqueda igual; el `self` link revela qué aplicó de verdad. El cliente exige rigor con el header `Prefer: handling=strict` (error 400 ante lo desconocido). Fuente clásica de bugs silenciosos: creíste filtrar y no filtraste.

### Una URL compleja, desglosada token a token

```http
GET [base]/Observation?patient.identifier=https://fhir.gob.sv/id/dui|01234567-8
  &category=vital-signs
  &code=http://loinc.org|85354-9
  &date=ge2026-01-01&date=lt2026-07-01
  &_sort=-date&_count=50
  &_include=Observation:encounter
  &_total=accurate
```

1. `patient.identifier=...` — chaining al Patient + token sobre su Identifier (system|value): no necesitas conocer el id lógico del paciente.
2. `category=vital-signs` — token sin sistema: ese código en cualquier CodeSystem.
3. `code=http://loinc.org|85354-9` — token con sistema: solo el panel de presión arterial LOINC.
4. `date=ge2026-01-01&date=lt2026-07-01` — dos date en AND: primer semestre de 2026.
5. `_sort=-date` — más recientes primero; `_count=50` — hasta 50 matches por página.
6. `_include=Observation:encounter` — añade los Encounters referenciados (entries con `search.mode=include`).
7. `_total=accurate` — exige conteo exacto en `Bundle.total`.

## Errores comunes y gotchas

- **Confundir AND con OR**: `status=final&status=amended` es AND (imposible sobre un elemento único); `status=final,amended` es OR. Parámetros repetidos = AND; comas = OR.
- **Token sin sistema en producción**: `code=8867-4` matchea ese código en cualquier CodeSystem; dos catálogos con códigos numéricos colisionan. Usa `system|code`.
- **Construir la página 2 a mano** con offsets propios: la paginación es opaca; sigue `link.next`.
- **`eq2026` "no funciona"**: sí funciona — como rango anual. El error es asumir comparación de cadenas; la precisión del valor define el rango.
- **`:not` y ausentes**: `param:not=X` también devuelve recursos donde el elemento falta. `:not` no significa "presente y distinto".
- **Chaining con nombre de elemento**: `Observation?subject.birthDate=...` falla; el SearchParameter se llama `birthdate`. Cada eslabón es un parámetro, no un path FHIR.
- **No tipificar cadenas ambiguas**: `subject.name` sobre Observation abarca Patient, Group, Device...; `subject:Patient.name` es preciso y más barato.
- **Asumir soporte universal**: los parámetros reales están en el CapabilityStatement; un servidor lenient ignora lo que no conoce. Audita el `self` link o usa `Prefer: handling=strict`.
- **Composite simulado con dos parámetros sueltos**: falsos positivos entre repeticiones distintas del elemento.
- **Esperar `total` siempre**: es opcional (salvo `_summary=count`); muchos servidores lo omiten o lo estiman.
- **Olvidar URL-encoding**: el `|` de los tokens debe viajar como `%7C` en clientes estrictos; los ejemplos de la especificación lo muestran sin codificar por legibilidad.

## Nivel experto

- **Semántica de `_include:iterate`**: sin `:iterate`, `_include` se evalúa solo sobre los matches. Con él, el servidor itera sobre los ya incluidos (y puede cortar para evitar ciclos). Patrón real: MedicationRequests + sus Medications + los Practitioners solicitantes en una sola llamada.
- **Costo de los índices**: cada SearchParameter habilitado implica indexación en escritura. En servidores institucionales (HAPI, etc.) se deshabilitan parámetros no usados y se definen **SearchParameter personalizados** (recurso SearchParameter con expresión FHIRPath) para necesidades locales — p. ej. buscar pacientes por municipio guardado en una extensión.
- **Consistencia entre páginas**: la especificación no garantiza aislamiento tipo snapshot; entre la página 1 y la 2 pueden crearse o borrarse recursos. Los servidores serios materializan el resultado (de ahí los `_getpages` opacos con expiración).
- **`_text`, `_content`, `_filter`**: capacidades opcionales de texto libre y filtros booleanos (`Patient?_filter=given eq "ana" and birthdate ge 1990-01-01`); reconócelas, no las asumas disponibles.
- **head vs summary**: para sondas de existencia usa `_summary=count` (barato) en lugar de traer páginas y contarlas.
- **R5**: refina modificadores y semánticas de _include, pero la mecánica central (tipos, prefijos, chaining, paginación opaca) es idéntica: lo aprendido en R4 transfiere.
- **Auditoría institucional**: registra el `self` link de cada búsqueda ejecutada; es la evidencia de qué criterios aplicó el servidor, no lo que el cliente creyó enviar.

## Chuleta

| Tema | Clave |
|---|---|
| Combinación | `&` = AND; `,` = OR dentro del parámetro |
| Token | 4 formas: `code`, `system|code`, `|code`, `system|` |
| Prefijos | eq ne gt lt ge le sa eb ap; fechas = rangos por precisión; sa/eb exigen separación total |
| string | Default empieza-por insensible; `:exact`; `:contains` |
| `:missing` | `=true` ausente, `=false` presente |
| `:in` / `:below` | Pertenencia a ValueSet / subsunción jerárquica |
| Reference | `id`, `Tipo/id`, URL, `:identifier` (lógica), `:Tipo` (tipar) |
| Chaining | `param.paramDestino`; tipado `subject:Patient.name`; multi-nivel |
| `_has` | `_has:Tipo:refParam:critParam=valor`; anidable |
| Composite | `param=comp1$comp2` — misma repetición del elemento |
| `_include` / `_revinclude` | `Tipo:parametro`; `:iterate` transitivo; `search.mode=include` |
| `_sort` / `_count` / `_elements` | `-` desc; _count limita matches; _elements proyecta (SUBSETTED) |
| `_summary` | true / text / data / count / false |
| `_total` | none / estimate / accurate |
| Paginación | Seguir `link.next` (opaco); `self` = criterios reales |
| Desconocidos | Lenient por defecto; `Prefer: handling=strict` |
| POST _search | Form-encoded; URLs largas o datos sensibles |

## Autoevaluación

1. ¿Qué diferencia hay entre `Patient?name=ana&name=maria` y `Patient?name=ana,maria`?
2. Escribe la búsqueda: "Observations de frecuencia cardíaca LOINC 8867-4 (solo LOINC) de julio de 2026, más recientes primero, 10 por página".
3. ¿Por qué `component-code=8480-6&component-value-quantity=gt140` puede dar falsos positivos y cuál es la forma correcta?
4. Traduce a una frase: `Patient?_has:Condition:patient:code=http://snomed.info/sct|38341003`.
5. Un Encounter tiene `period.start=2026-02-20` y sin `period.end`. ¿Matchea `date=sa2026-03-01`? ¿Y `date=gt2026-03-01`?
6. Enviaste `codee=...` (typo) y el servidor devolvió 200 con miles de resultados. ¿Qué dos mecanismos te habrían protegido?
7. ¿Cómo pides pacientes que NO tienen fecha de nacimiento registrada?
8. ¿Qué hace `Patient?_id=123&_revinclude=Observation:patient` y por qué es más útil que `Patient/123`?

### Respuestas

1. La primera es AND: algún name que empiece por "ana" Y alguno por "maria" (posible solo por ser repetible). La segunda es OR: ana o maria.
2. `Observation?code=http://loinc.org|8867-4&date=ge2026-07-01&date=lt2026-08-01&_sort=-date&_count=10`.
3. Cada criterio suelto puede satisfacerse en components **distintos** del mismo recurso. Correcto: `component-code-value-quantity=http://loinc.org|8480-6$gt140` (composite con `$`).
4. Pacientes referenciados (vía el parámetro `patient`) por alguna Condition con código SNOMED 38341003 (hipertensión).
5. `sa` no: exige que el periodo empiece después del 2026-03-01 y empieza el 2026-02-20. `gt` sí: el periodo abierto se extiende más allá de la fecha.
6. `Prefer: handling=strict` (el servidor habría devuelto error) y auditar `link.self` (muestra los parámetros realmente aplicados).
7. `Patient?birthdate:missing=true`.
8. Devuelve el paciente 123 **y** todas las Observations que lo referencian, en un solo Bundle searchset; `Patient/123` solo devuelve el recurso, sin relacionados.

## Para profundizar

- [Search R4](http://hl7.org/fhir/R4/search.html) — la página que hay que leer dos veces: tipos, prefijos, modificadores, chaining, _has, _include.
- [HTTP / API RESTful R4](http://hl7.org/fhir/R4/http.html) — interacciones, Prefer handling, POST _search.
- [Bundle R4](http://hl7.org/fhir/R4/bundle.html) — searchset, links de paginación, search.mode.
- [SearchParameter R4](http://hl7.org/fhir/R4/searchparameter.html) — cómo se definen (y crean) parámetros de búsqueda.
- [Servidor público HAPI](https://hapi.fhir.org/baseR4) — banco de pruebas para cada sintaxis de esta lección.
