# HTTP y REST: la API completa de un servidor FHIR

> **En simple:** la API RESTful de FHIR es un contrato preciso: cada operación (leer, crear, actualizar, buscar...) tiene un nombre oficial, un verbo HTTP, una forma de URL, cabeceras definidas y códigos de estado esperados. Este tema cubre el contrato completo de R4: interacciones instance/type/system, versionado y bloqueo optimista, operaciones condicionales, búsqueda con Bundle searchset, y batch vs transaction. Es el corazón del examen Foundational.

## El contrato: interacciones y URLs

La API se organiza en tres niveles. Nombres oficiales (así aparecen en el CapabilityStatement y en el examen):

| Nivel | Interacción | Petición | Qué hace |
|-------|-------------|----------|----------|
| Instancia | **read** | `GET [base]/[type]/[id]` | Lee el estado actual |
| Instancia | **vread** | `GET [base]/[type]/[id]/_history/[vid]` | Lee una versión concreta |
| Instancia | **update** | `PUT [base]/[type]/[id]` | Reemplaza el recurso completo |
| Instancia | **patch** | `PATCH [base]/[type]/[id]` | Modifica parcialmente |
| Instancia | **delete** | `DELETE [base]/[type]/[id]` | Elimina |
| Instancia | **history** | `GET [base]/[type]/[id]/_history` | Versiones de UNA instancia |
| Tipo | **create** | `POST [base]/[type]` | Crea; el servidor asigna el id |
| Tipo | **search** | `GET [base]/[type]?params` (o `POST [base]/[type]/_search`) | Busca; devuelve Bundle searchset |
| Tipo | **history** | `GET [base]/[type]/_history` | Cambios de todo el tipo |
| Sistema | **capabilities** | `GET [base]/metadata` | CapabilityStatement del servidor |
| Sistema | **batch / transaction** | `POST [base]` | Bundle de peticiones múltiples |
| Sistema | **history / search** | `GET [base]/_history` · `GET [base]?params` | Sobre todo el servidor |

La gramática de URL que debes descomponer de memoria:

```
https://hapi.fhir.org/baseR4 / Patient / 123 / _history / 2
\________ [base] ___________/ \[type]/ \[id]/            \[vid]/
```

Detalles del contrato que caen en examen:

- **create (POST)**: el cuerpo NO lleva `id` (si lo lleva, el servidor lo ignora o rechaza). Respuesta **201 Created** con header `Location: [base]/Patient/[id-nuevo]/_history/1`.
- **update (PUT)**: el `id` va en la URL **y** en el cuerpo, y deben coincidir (si no: 400). Reemplaza TODO el recurso: lo que no envíes se pierde. Si el id no existe y el servidor lo permite, PUT crea con id del cliente ("update as create", responde 201); muchos servidores lo deshabilitan y responden **405 Method Not Allowed**.
- **patch**: para cambios parciales, con tres formatos posibles: JSON Patch (`Content-Type: application/json-patch+json`), XML Patch, o FHIRPath Patch (parámetros FHIR).
- **delete**: responde 200 o **204 No Content**. Un read posterior devuelve **410 Gone** (existió y fue borrado); un vread de una versión previa puede seguir funcionando. 404 es "nunca existió aquí"; 410 es "existió".
- **Idempotencia**: GET, PUT y DELETE son idempotentes (repetirlos deja el mismo estado final); **POST no** (cada repetición crea otro recurso). Por eso un cliente que reintenta POST a ciegas ante timeouts puede duplicar pacientes; el antídoto es el create condicional (abajo).

## Cabeceras, condicionales y bloqueo optimista

### Content negotiation

- `Accept: application/fhir+json` — formato que quieres recibir.
- `Content-Type: application/fhir+json` — formato de lo que envías (POST/PUT/PATCH).
- Los MIME oficiales son `application/fhir+json` y `application/fhir+xml`. El parámetro `?_format=json` es la alternativa por URL (útil en navegadores).

### Prefer: controla el cuerpo de la respuesta

En create/update, el cliente puede pedir qué quiere de vuelta:

- `Prefer: return=minimal` — sin cuerpo (ahorra ancho de banda).
- `Prefer: return=representation` — el recurso resultante completo (con id y meta actualizados).
- `Prefer: return=OperationOutcome` — un OperationOutcome con avisos/detalles.

### ETag e If-Match: bloqueo optimista (concurrencia)

Cada read exitoso devuelve `ETag: W/"3"` (el `versionId` como ETag débil) y `Last-Modified`. Para actualizar sin pisar cambios ajenos:

```http
PUT /baseR4/Patient/123 HTTP/1.1
Content-Type: application/fhir+json
If-Match: W/"3"
```

Si otro cliente ya actualizó (la versión actual es 4), el servidor responde **412 Precondition Failed** y tú relees, fusionas y reintentas. Sin `If-Match`, el último en escribir gana silenciosamente ("lost update"): en datos clínicos, inaceptable. Un servidor puede incluso exigir If-Match siempre (respondiendo 400/412 si falta).

### If-None-Exist: create condicional

Evita duplicados al crear:

```http
POST /baseR4/Patient HTTP/1.1
Content-Type: application/fhir+json
If-None-Exist: identifier=https://salud.gob.sv/identificadores/dui|01234567-8
```

El servidor busca con ese criterio: **0 resultados** -> crea (201); **1 resultado** -> NO crea y devuelve el existente (200); **más de 1** -> **412 Precondition Failed**. Es el patrón correcto para cargas repetibles e integraciones que reintentan.

### Update y delete condicionales

- **Update condicional**: `PUT [base]/Patient?identifier=...|01234567-8` (sin id en la URL). 0 matches -> crea; 1 match -> actualiza ese; varios -> 412. Útil cuando conoces la identidad de negocio pero no el id lógico del servidor.
- **Delete condicional**: `DELETE [base]/Patient?identifier=...` con la misma lógica de matches.

Estas operaciones son poderosas y peligrosas: dependen de la calidad de tus criterios de búsqueda. Criterio ambiguo = 412 en el mejor caso, actualización del recurso equivocado en el peor (si el criterio matchea al paciente incorrecto de forma única).

## Códigos de estado por interacción

Regla mental: 2xx éxito, 4xx culpa del cliente, 5xx culpa del servidor. El mapa fino:

| Código | Significado | Cuándo lo verás |
|--------|-------------|-----------------|
| 200 OK | Éxito con cuerpo | read, search, update exitoso, delete (con cuerpo) |
| 201 Created | Recurso creado | create; update-as-create; mira `Location` |
| 204 No Content | Éxito sin cuerpo | delete; update con `Prefer: return=minimal` |
| 304 Not Modified | La versión que tienes sigue vigente | read con `If-None-Match` (caché) |
| 400 Bad Request | Petición mal formada | JSON roto, parámetro ilegal, id de URL ≠ id del cuerpo |
| 401 Unauthorized | No autenticado | falta token o es inválido/expirado |
| 403 Forbidden | Autenticado sin permiso | el scope no alcanza |
| 404 Not Found | No existe (o nunca existió) | read de id inexistente, tipo no soportado |
| 405 Method Not Allowed | Interacción no permitida | PUT-create con id de cliente deshabilitado; DELETE prohibido |
| 409 Conflict | Conflicto de versión/estado | update concurrente detectado (algunos servidores lo usan junto a 412) |
| 410 Gone | Existió y fue borrado | read tras delete |
| 412 Precondition Failed | Falló la precondición | If-Match con versión vieja; condicionales con múltiples matches |
| 422 Unprocessable Entity | Sintaxis OK, contenido inválido | viola reglas FHIR/perfil (falta campo obligatorio, código fuera del ValueSet required) |

La tripleta estrella de examen: **400 vs 422 vs 404**. 400 = la petición está rota; 422 = la petición está bien formada pero el recurso viola reglas de negocio/perfil; 404 = eso no existe. Y su pareja: **401 vs 403** (no autenticado vs autenticado sin permiso). Cuando algo falla, el servidor debe devolver un **OperationOutcome** en el cuerpo con `issue[].severity/code/diagnostics`: léelo siempre; ahí está el porqué.

## Búsqueda básica y el Bundle searchset

La búsqueda se hace con GET sobre el tipo (o POST form-encoded a `[base]/[type]/_search`, útil cuando la query es enorme o no debe quedar en logs de URL):

```
GET [base]/Patient?family=Perez&gender=female
GET [base]/Observation?code=8867-4&date=ge2024-01-01&_count=5
POST [base]/Patient/_search
Content-Type: application/x-www-form-urlencoded

family=Perez&gender=female
```

- Parámetros unidos con `&` = **Y** lógico. Valores separados por coma (`gender=male,female`) = **O** lógico.
- Prefijos para fechas/números/cantidades: `eq ne gt lt ge le sa eb ap`, pegados al valor: `date=ge2024-01-01` (no `date>=...`).
- Parámetros de control con `_`: `_count` (tamaño de página), `_sort` (`-fecha` desciende), `_include` (trae los referenciados: `Observation?_include=Observation:patient`), `_revinclude` (los que me referencian), `_summary`, `_elements`.

### El Bundle searchset

Una búsqueda devuelve **siempre** un Bundle tipo `searchset`, tenga 0, 1 o mil resultados:

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 137,
  "link": [
    { "relation": "self", "url": "https://hapi.fhir.org/baseR4/Patient?family=Perez&_count=20" },
    { "relation": "next", "url": "https://hapi.fhir.org/baseR4?_getpages=abc123&_getpagesoffset=20..." }
  ],
  "entry": [
    {
      "fullUrl": "https://hapi.fhir.org/baseR4/Patient/456",
      "resource": { "resourceType": "Patient", "id": "456" },
      "search": { "mode": "match" }
    }
  ]
}
```

- `total`: cuántos recursos cumplen el criterio (puede superar lo que ves; es opcional y algunos servidores lo omiten o lo estiman).
- `entry[]`: la página actual; `search.mode` distingue `match` (cumple el criterio) de `include` (vino por `_include`). Los include **no cuentan** en `total`.
- `link[]`: la paginación. La URL de `relation: "next"` es **opaca**: síguela tal cual, no construyas la página 2 a mano. Paginar = seguir `next` hasta que no exista.

Error clásico: tratar la respuesta de `GET /Patient?family=Perez` como si fuera un Patient. Es un Bundle; el paciente vive en `entry[0].resource`.

## Batch y transaction: múltiples operaciones en un viaje

Ambos son un `POST [base]` con un Bundle cuyas `entry` llevan `request` (método + URL relativa). La diferencia es el contrato de ejecución:

- **batch**: cada entrada se procesa **independientemente** (best-effort). Unas pueden fallar y otras triunfar. Las entradas no pueden depender entre sí.
- **transaction**: **atómico**. O todo se aplica, o nada (si una entrada falla, el servidor revierte todo y responde con error). Además el servidor **resuelve referencias internas** entre entradas y procesa en orden seguro: primero DELETE, luego POST, luego PUT/PATCH, luego GET.

Ejemplo de transaction que crea un paciente y una observación que lo referencia, usando `urn:uuid:` como fullUrl temporal:

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:7f0a1e5b-3c1d-4f7e-9a2b-1234567890ab",
      "resource": {
        "resourceType": "Patient",
        "identifier": [{ "system": "https://salud.gob.sv/identificadores/dui", "value": "01234567-8" }],
        "name": [{ "family": "Hernandez", "given": ["Maria"] }]
      },
      "request": { "method": "POST", "url": "Patient",
        "ifNoneExist": "identifier=https://salud.gob.sv/identificadores/dui|01234567-8" }
    },
    {
      "fullUrl": "urn:uuid:9b8c2d4e-5f6a-4b3c-8d1e-abcdef123456",
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8867-4" }] },
        "subject": { "reference": "urn:uuid:7f0a1e5b-3c1d-4f7e-9a2b-1234567890ab" },
        "valueQuantity": { "value": 72, "unit": "beats/min",
          "system": "http://unitsofmeasure.org", "code": "/min" }
      },
      "request": { "method": "POST", "url": "Observation" }
    }
  ]
}
```

El servidor crea el Patient, le asigna un id real, y **reescribe** `subject.reference` de la Observation con ese id (`Patient/789`). La respuesta es un Bundle `transaction-response` con `entry[].response.status`, `location` y `etag` por entrada, en el mismo orden. Nota el `ifNoneExist` dentro de `request`: los condicionales también funcionan dentro de Bundles.

Cuándo usar cuál: transaction para grafos de recursos que deben nacer juntos (paciente + encuentro + observaciones) o consistencia todo-o-nada; batch para operaciones masivas independientes donde un fallo parcial es tolerable y se reprocesa.

## Errores comunes y gotchas

- **Confundir 400 con 422**: 400 = petición rota (sintaxis, parámetro ilegal); 422 = recurso bien formado que viola reglas FHIR o del perfil. El examen adora esta pareja, y la de **401 vs 403**.
- **Confundir 404 con 410**: 404 nunca existió (o no se sabe); 410 existió y fue borrado. Tras un DELETE esperas 410 en el read.
- **Creer que batch es atómico o que transaction es best-effort**: es exactamente al revés. Y en batch las entradas **no** pueden referenciarse entre sí; en transaction sí (urn:uuid).
- **Reintentar POST sin condicional**: duplicas recursos. Usa `If-None-Exist` (o PUT condicional) en todo flujo con reintentos.
- **Construir URLs de paginación a mano**: el link `next` es opaco (tokens de sesión de búsqueda). Síguelo literal.
- **Ignorar `search.mode`**: mezclar matches con includes infla tus conteos; los include no suman al `total`.
- **Olvidar que PUT reemplaza TODO**: mandar un Patient "solo con el teléfono nuevo" borra el resto de campos. Para parcial, PATCH.
- **Esperar 201 en un update normal**: update exitoso = 200 (201 solo si el update creó el recurso).
- **Prefijos de fecha como operadores**: es `date=ge2024-01-01`, no `date>=2024-01-01` ni `date=>2024...`.
- **Asumir `total` siempre presente y exacto**: es opcional; hay servidores que lo omiten o estiman por rendimiento.

## Nivel experto

- **El CapabilityStatement es el contrato real**: antes de codificar contra un servidor, lee en `[base]/metadata` qué interacciones, parámetros de búsqueda y condicionales declara (`conditionalCreate`, `conditionalUpdate`, `conditionalDelete`, `readHistory`, `updateCreate`). "Es un servidor R4" no te dice nada de eso; dos servidores R4 conformes pueden diferir muchísimo.
- **Bloqueo optimista como política institucional**: en una plataforma nacional multi-escritor, exige `If-Match` en todos los update (los servidores pueden configurarse para rechazar updates sin él). El costo de un 412 y un retry es trivial; el costo de un lost update clínico, no.
- **Transaction no es infinita**: el tamaño del Bundle importa (memoria, locks, tiempo de transacción en la base). Regla operativa: transactions pequeñas y coherentes (un paciente y su grafo), nunca "migración completa en un transaction". Para volumen usa batch con reproceso, o Bulk Data para lectura masiva.
- **Los condicionales dependen de la calidad de los identificadores**: `If-None-Exist: identifier=...` solo funciona si el system del identifier está bien gobernado (único, estable, poblado). El diseño del espacio de identificadores nacionales es prerrequisito de las operaciones condicionales, no un detalle.
- **POST _search y la privacidad de los logs**: los parámetros en URL terminan en logs de proxies y servidores. Búsquedas con datos sensibles (nombres, identificadores) en un entorno serio van por `POST [base]/[type]/_search` con cuerpo form-encoded.
- **HEAD y caché**: los servidores pueden soportar HEAD (read sin cuerpo) y `If-None-Match` para 304: en apps móviles con listas grandes, ahorra tráfico real.
- **Diferencias R5/R6 a vigilar**: la API REST es normativa desde R4 y estable; R5 añade matices (p. ej. el header `X-Provenance` formalizado, mejoras de search) pero los fundamentos que aprendiste aquí no cambian. Lo que sí evoluciona rápido es Subscriptions (ya lo viste en el panorama).

## Chuleta

| Quiero | Hago | Espero |
|--------|------|--------|
| Leer | `GET [base]/Patient/123` | 200 + Patient (ETag, Last-Modified) |
| Versión concreta | `GET [base]/Patient/123/_history/2` | 200 + esa versión (410 si borrada) |
| Historial | `GET [base]/Patient/123/_history` | 200 + Bundle history |
| Crear | `POST [base]/Patient` (sin id) | 201 + Location .../[id]/_history/1 |
| Crear sin duplicar | POST + `If-None-Exist: identifier=sys\|val` | 201 crea / 200 ya existía / 412 varios |
| Reemplazar | `PUT [base]/Patient/123` (completo, id coincide) | 200 (201 si update-as-create) |
| Reemplazar seguro | PUT + `If-Match: W/"3"` | 200, o 412 si hubo escritura concurrente |
| Parcial | `PATCH [base]/Patient/123` (json-patch/fhirpath) | 200 |
| Borrar | `DELETE [base]/Patient/123` | 200/204; read posterior -> 410 |
| Buscar | `GET [base]/Patient?family=Perez` | 200 + Bundle searchset |
| Buscar privado | `POST [base]/Patient/_search` (form-encoded) | 200 + Bundle searchset |
| Capacidades | `GET [base]/metadata` | 200 + CapabilityStatement |
| Varias a la vez | `POST [base]` + Bundle batch/transaction | 200 + Bundle *-response |

- Headers: `Accept` / `Content-Type` = `application/fhir+json`; `Prefer: return=minimal|representation|OperationOutcome`.
- Idempotentes: GET, PUT, DELETE. No: POST. Prefijos: `eq ne gt lt ge le sa eb ap` pegados al valor.
- Y lógico = `&`; O lógico = valores con coma. Control: `_count _sort _include _revinclude _summary _elements`.
- 400 sintaxis · 401 sin autenticar · 403 sin permiso · 404 no existe · 405 no permitido · 409/412 conflicto/precondición · 410 borrado · 422 inválido.
- transaction = atómico + urn:uuid + orden DELETE->POST->PUT->GET; batch = independiente, sin referencias cruzadas.

## Autoevaluacion

1. ¿Qué diferencia hay entre read, vread y history de instancia, y qué URL usa cada uno?
2. Explica el flujo completo de bloqueo optimista: qué headers intervienen y qué código señala el conflicto.
3. ¿Qué hace `If-None-Exist` y qué responde el servidor en los tres escenarios posibles (0, 1, varios matches)?
4. Tu POST de un Patient devuelve 422. ¿Qué sabes con certeza y en qué se diferencia de 400 y de 404?
5. ¿Por qué el link `next` de un Bundle searchset debe seguirse tal cual y qué campo distingue matches de includes?
6. En un Bundle transaction, ¿cómo referencia una Observation al Patient creado en el mismo Bundle, y qué hace el servidor con esa referencia?
7. ¿En qué orden procesa un servidor las entradas de un transaction y por qué importa?
8. Escribe la búsqueda de observaciones LOINC 8867-4 desde el 1 de enero de 2024, 5 por página, incluyendo los pacientes referenciados.

### Respuestas

1. read: `GET [base]/[type]/[id]`, estado actual. vread: `GET .../[id]/_history/[vid]`, una versión concreta. history de instancia: `GET .../[id]/_history`, el Bundle con todas las versiones.
2. El read devuelve `ETag: W/"[versionId]"`; el cliente envía su update con `If-Match: W/"[versionId]"`. Si la versión en el servidor ya cambió, responde 412 Precondition Failed y el cliente relee, fusiona y reintenta. Sin If-Match hay riesgo de lost update.
3. Create condicional: el servidor evalúa el criterio de búsqueda del header. 0 matches -> crea y responde 201; 1 match -> no crea y devuelve el existente con 200; varios matches -> 412 Precondition Failed. Es la defensa estándar contra duplicados en reintentos.
4. 422: la petición llegó bien formada (sintaxis correcta) pero el recurso viola reglas FHIR o del perfil (campo obligatorio ausente, código fuera de un binding required...). 400 = la petición misma está rota. 404 = el recurso o la ruta no existe. El cuerpo debe traer un OperationOutcome con el detalle.
5. Porque es una URL opaca con tokens de la sesión de búsqueda del servidor: construir "página 2" a mano no es interoperable. `entry[].search.mode` distingue `match` (cumple el criterio, cuenta en total) de `include` (vino por _include, no cuenta).
6. La entry del Patient lleva `fullUrl: "urn:uuid:..."` y la Observation usa esa misma urn en `subject.reference`. Al ejecutar, el servidor asigna el id real y reescribe la referencia (p. ej. a `Patient/789`) antes de persistir.
7. DELETE, luego POST, luego PUT/PATCH, luego GET. Garantiza que las creaciones existan antes de que otras entradas las referencien y que los borrados no invaliden lo que sigue; junto con la atomicidad, es lo que hace fiable el grafo.
8. `GET [base]/Observation?code=8867-4&date=ge2024-01-01&_count=5&_include=Observation:patient`

## Para profundizar

- [API RESTful de FHIR R4](http://hl7.org/fhir/R4/http.html) — LA página de este tema: cada interacción con sus códigos, headers y condicionales; léela completa al menos una vez.
- [Búsqueda R4](http://hl7.org/fhir/R4/search.html) — parámetros, prefijos, modificadores, _include/_revinclude; tu próximo tema profundizará aquí.
- [Recurso Bundle R4](http://hl7.org/fhir/R4/bundle.html) — searchset, history, batch/transaction, reglas de fullUrl y resolución de referencias.
- [OperationOutcome R4](http://hl7.org/fhir/R4/operationoutcome.html) — la anatomía de los errores; aprende a leer issue.severity/code.
- [HTTP en MDN (español)](https://developer.mozilla.org/es/docs/Web/HTTP) — el sustrato: métodos, headers, códigos y caché explicados fuera del contexto FHIR.
- [Servidor público HAPI R4](https://hapi.fhir.org/baseR4) — tu laboratorio para ejecutar todo lo anterior (solo datos ficticios).
