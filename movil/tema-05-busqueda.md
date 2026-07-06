# 📱 Tema 5 · Búsqueda avanzada

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Construir búsquedas FHIR con GET y varios parámetros combinados (AND / OR).
- Usar prefijos de comparación (gt, lt, ge, le, eq, ne) en fechas y números.
- Aplicar modificadores (:exact, :contains, :missing, :not) correctamente según el tipo de parámetro.
- Encadenar búsquedas (chaining) y hacer chaining inverso (_has).
- Traer recursos relacionados en un solo viaje con _include y _revinclude.
- Paginar resultados leyendo Bundle.link y controlar el tamaño con _count.

## Lectura

### La búsqueda es una conversación con el servidor

En FHIR buscas con GET sobre un tipo de recurso, pasando parámetros en la query string:

```
GET [base]/Patient?family=Perez&gender=female
```

Regla de combinación: parámetros distintos unidos por `&` son **AND**; valores separados por coma dentro de un parámetro son **OR** (`gender=male,female`). Repetir el mismo parámetro (`date=ge2024-01-01&date=le2024-12-31`) también es AND — así construyes rangos de fechas.

La respuesta SIEMPRE es un Bundle de tipo `searchset`, aunque haya cero resultados (eso es un 200 con `total: 0`, no un 404). El 404 es para `GET Patient/999` cuando ese id no existe; una búsqueda sin coincidencias es una búsqueda exitosa vacía. Confundir esto es un clásico del examen.

### Tipos de parámetro y prefijos

Cada parámetro de búsqueda tiene un tipo: string, token, date, number, quantity, reference, uri. El tipo determina qué puedes hacer con él:

- **date / number / quantity** aceptan prefijos: `eq`, `ne`, `gt`, `lt`, `ge`, `le` (y `sa`/`eb` para "empieza después"/"termina antes").
  - `Observation?date=ge2024-01-01` → desde el 1 de enero de 2024 inclusive.
- **token** busca códigos con la forma `system|code`:
  - `Observation?code=http://loinc.org|8867-4` (frecuencia cardíaca). Solo `code=8867-4` busca el código en cualquier system.
- **string** por defecto hace coincidencia "empieza por", insensible a mayúsculas y acentos.
- **reference** acepta `subject=Patient/123`.

### Modificadores: afinar la puntería

Se añaden con `:` al nombre del parámetro:

- `:exact` — (strings) coincidencia exacta, sensible a mayúsculas: `Patient?name:exact=John`.
- `:contains` — (strings) el valor aparece en cualquier parte: `Patient?name:contains=ann`.
- `:missing` — el elemento está ausente/presente: `Patient?birthdate:missing=true` trae pacientes SIN fecha de nacimiento.
- `:not` — (tokens) negación: `Observation?status:not=final` (donde el servidor lo soporte).

Error común: usar `:exact` en un token o `:not` en un string — los modificadores dependen del tipo de parámetro.

### Chaining: filtrar A por un campo de B

Cuando el filtro vive en el recurso referenciado, encadenas con punto:

```
GET [base]/Observation?subject:Patient.name=Smith
```

"Observaciones cuyo subject es un Patient con nombre Smith." Forma general: `{parámetro}:{TipoRecurso}.{parámetro-en-B}=valor`. El `:TipoRecurso` es necesario cuando la referencia admite varios tipos (subject puede apuntar a Patient, Group...). Olvidar el tipo es el error clásico de chaining.

### Reverse chaining: _has

`_has` filtra A según recursos que **lo referencian**:

```
GET [base]/Patient?_has:Observation:patient:code=8867-4
```

"Pacientes que tienen al menos una Observation de frecuencia cardíaca." Léelo de atrás hacia adelante: existe una Observation, cuyo campo patient apunta a este Patient, con ese code.

### _include y _revinclude: evita el problema N+1

Sin includes, buscar 50 observaciones y luego pedir su paciente uno por uno son 51 peticiones. Con includes, un solo Bundle:

- **_include** trae lo que los resultados **referencian**:
  `Observation?_include=Observation:subject` → observaciones + sus Patient.
- **_revinclude** trae lo que **referencia** a los resultados:
  `Patient?_revinclude=Observation:subject` → pacientes + sus observaciones.

Truco para no confundirlos: _include sigue la flecha hacia adelante; _revinclude la sigue en reversa. Los recursos incluidos llegan en el mismo Bundle con `entry.search.mode = "include"` (los que coinciden con la búsqueda llevan `"match"`), y NO cuentan en `total`.

### Paginación

El servidor decide el tamaño de página (puedes sugerir con `_count=10`). El Bundle trae enlaces:

```json
"link": [
  { "relation": "self", "url": "..." },
  { "relation": "next", "url": "..." }
]
```

Para la siguiente página, sigue la URL de `relation: "next"` tal cual (es opaca, no la construyas tú). Cuando ya no hay `next`, terminaste. Otros parámetros de control: `_sort=birthdate` (orden ascendente; `_sort=-date` descendente), `_summary`, `_elements` para respuestas ligeras.

### Códigos de estado que verás buscando

- 200: búsqueda procesada (aunque `total` sea 0).
- 400: parámetro mal formado o no soportado (según la política del servidor).
- 401/403: no autenticado / sin permiso.
- Regla mental: 4xx = lo hiciste mal tú; 5xx = falló el servidor.

## Chuleta

| Quiero... | Sintaxis |
|---|---|
| AND | `?family=Perez&gender=female` |
| OR | `?gender=male,female` |
| Rango fechas | `?date=ge2024-01-01&date=le2024-12-31` |
| Token con system | `?code=http://loinc.org\|8867-4` |
| Exacto / contiene | `name:exact=John` / `name:contains=ann` |
| Sin elemento | `birthdate:missing=true` |
| Chaining | `Observation?subject:Patient.name=Smith` |
| Reverse chaining | `Patient?_has:Observation:patient:code=8867-4` |
| Traer referenciados | `Observation?_include=Observation:subject` |
| Traer referenciadores | `Patient?_revinclude=Observation:subject` |
| Página de N | `_count=10`; siguiente = link `next` |
| Ordenar | `_sort=-date` |

## Autoevaluación (sin mirar arriba)

1. ¿Qué código HTTP y qué `total` devuelve una búsqueda sin coincidencias?
2. Construye la URL: observaciones de pacientes apellidados "García".
3. ¿Cuál es la diferencia entre `_include` y `_revinclude`? Da un ejemplo de cada uno.
4. ¿Cómo pides pacientes nacidos en 1990 o después, máximo 20 por página?
5. ¿Cómo distingues en el Bundle un recurso que coincidió con la búsqueda de uno que llegó por `_include`?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 5 Búsqueda".
2. Añade estos enlaces oficiales como fuentes:
   - http://hl7.org/fhir/R4/search.html — la especificación completa de search: tipos de parámetro, modificadores, chaining.
   - http://hl7.org/fhir/R4/http.html — API REST y códigos de estado que devuelve cada interacción.
   - http://hl7.org/fhir/R4/bundle.html — estructura del searchset, total, entry.search.mode y link.
   - https://hapi.fhir.org/baseR4 — servidor público para probar cada URL de este pack (solo datos sintéticos).
3. Prompts sugeridos:
   - "Dame 8 escenarios clínicos y pídeme construir la URL de búsqueda; corrige mi sintaxis."
   - "Explica paso a paso cómo resuelve el servidor `Observation?subject:Patient.name=Smith` y en qué se diferencia de `_has`."
   - "Hazme un simulacro de examen sobre modificadores y prefijos: cuáles aplican a qué tipo de parámetro."

---

### Respuestas

1. 200 OK con un Bundle searchset y `total: 0`. No es 404.
2. `GET [base]/Observation?subject:Patient.family=Garcia` (chaining sobre subject con tipo Patient).
3. `_include` trae recursos que los resultados referencian (Observation → su Patient); `_revinclude` trae recursos que referencian a los resultados (Patient ← sus Observation).
4. `GET [base]/Patient?birthdate=ge1990-01-01&_count=20`.
5. Por `entry.search.mode`: `"match"` para coincidencias, `"include"` para los incluidos (que además no cuentan en `total`).
