# 📱 Tema 2 · HTTP y REST: hablar con un servidor FHIR

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Descomponer una URL FHIR: base + tipo de recurso + id (+ historia).
- Usar los verbos HTTP correctos: GET, POST, PUT, PATCH, DELETE, y las interacciones read / vread / search / create / update / delete.
- Interpretar códigos de estado: 200, 201, 400, 401, 403, 404, 410, 422, 500…
- Construir búsquedas con parámetros, prefijos de fecha (ge, le…) y controles (`_count`, `_sort`, `_include`).
- Explicar la idempotencia y por qué POST no la tiene.
- Leer un Bundle `searchset`: `total`, `entry`, `link` (paginación).

## Lectura

### El modelo: cliente pide, servidor responde

REST es un estilo para que un cliente (tu app) pida cosas a un servidor por HTTP. Analogía del restaurante: la **URL** es el plato que señalas en el menú; el **método HTTP** es la acción (mirar, pedir, cambiar, cancelar); los **headers** son las instrucciones al mesero ("sin picante, en plato hondo"); el **código de estado** es la respuesta de cocina ("marchando", "no hay", "eso no existe").

Anatomía de una URL FHIR:

```
https://hapi.fhir.org/baseR4 / Patient / 123
\______ base del servidor __/  \_tipo_/  \id/
```

Y las cabeceras que usarás siempre:

- `Accept: application/fhir+json` → "respóndeme en JSON FHIR".
- `Content-Type: application/fhir+json` → "lo que te envío en el cuerpo es JSON FHIR" (POST/PUT/PATCH).

### Las interacciones FHIR (nombres oficiales)

FHIR da nombre propio a cada operación REST. Aprende el par verbo ↔ interacción:

| Interacción | Petición | Qué hace |
|-------------|----------|----------|
| **read** | `GET [base]/Patient/123` | Lee un recurso concreto |
| **vread** | `GET [base]/Patient/123/_history/2` | Lee una versión concreta |
| **search** | `GET [base]/Patient?family=Perez` | Busca; devuelve un Bundle |
| **create** | `POST [base]/Patient` | Crea; el servidor asigna el id |
| **update** | `PUT [base]/Patient/123` | Reemplaza el recurso completo |
| **patch** | `PATCH [base]/Patient/123` | Modifica solo parte del recurso |
| **delete** | `DELETE [base]/Patient/123` | Borra |
| **history** | `GET [base]/Patient/123/_history` | Lista las versiones |
| **capabilities** | `GET [base]/metadata` | CapabilityStatement del servidor |

Detalles de examen:

- En **create** (POST) el cuerpo NO lleva `id`: lo asigna el servidor, que responde **201 Created** con la cabecera `Location` apuntando al recurso nuevo (incluida su versión).
- En **update** (PUT) envías el recurso **completo** con el `id` en la URL y en el cuerpo. No es un parche: lo que no mandes, se pierde (para cambios parciales existe PATCH). Si el id no existe y el servidor lo permite, PUT puede crear el recurso ("update as create").
- GET **nunca** modifica datos. Si un diseño usa GET para cambiar algo, está mal.

### Idempotencia (cae seguro)

Una operación es **idempotente** si repetirla N veces deja el sistema igual que hacerla una vez.

- **GET, PUT y DELETE son idempotentes**: leer dos veces no cambia nada; PUT dos veces deja el mismo documento; DELETE dos veces deja el recurso igual de borrado (aunque el segundo responda 404/410, el **estado** del sistema no cambia).
- **POST NO es idempotente**: dos POST iguales crean **dos** recursos distintos.

Analogía: PUT es "deja el documento exactamente así" (repítelo y queda igual). POST es "agrega una copia nueva" (cada vez, otra más). Por eso, si tu app reintenta peticiones ante fallos de red, reintentar un POST a ciegas puede duplicar pacientes.

### Códigos de estado: el semáforo

Regla mental: **4xx = lo hiciste mal tú (cliente); 5xx = falló el servidor**.

- **200 OK**: lectura/búsqueda/actualización exitosa.
- **201 Created**: recurso creado (mira la cabecera `Location`).
- **400 Bad Request**: petición mal formada (JSON roto, parámetro inválido).
- **401 Unauthorized**: no estás autenticado (falta token o es inválido).
- **403 Forbidden**: autenticado, pero sin permiso para eso (tema scopes).
- **404 Not Found**: el recurso o la ruta no existe.
- **410 Gone**: existió, pero fue borrado (lo verás tras un DELETE).
- **422 Unprocessable Entity**: el JSON llegó bien formado, pero el **recurso no es válido** según las reglas FHIR/perfil (p. ej. falta un campo obligatorio).
- **500 / 503**: error interno / servidor no disponible.

Distinción estrella de examen: **400 vs 422 vs 404**. 400 = sintaxis rota; 422 = sintaxis correcta pero contenido clínicamente/estructuralmente inválido; 404 = eso no existe. Además, cuando algo falla, un servidor FHIR suele devolver un recurso **OperationOutcome** en el cuerpo explicando el porqué: léelo siempre.

### Búsqueda: preguntar con parámetros

La búsqueda es GET sobre el **tipo** (sin id), con parámetros en la query string:

```
GET [base]/Patient?family=Perez&gender=female
GET [base]/Observation?code=8867-4
GET [base]/Observation?date=ge2024-01-01
```

Varios parámetros unidos con `&` se combinan con **Y** lógico. Para fechas y números existen prefijos: `eq`, `ne`, `gt`, `lt`, `ge`, `le` (ge = mayor o igual). Nota: van **pegados al valor** (`date=ge2024-01-01`), no como parámetro aparte.

Parámetros de control (empiezan con `_`):

- `_count=10` → resultados por página.
- `_sort=birthdate` → ordenar (con `-birthdate` desciende).
- `_include` → trae también los recursos referenciados (p. ej. `Observation?_include=Observation:patient` trae las observaciones Y sus pacientes en la misma respuesta).

### El Bundle searchset y la paginación

Una búsqueda **siempre** devuelve un **Bundle** de tipo `searchset`, aunque haya 0 o 1 resultados. Sus campos clave:

- `total`: cuántos recursos cumplen la búsqueda (puede ser mayor que lo que ves).
- `entry[]`: los recursos de la página actual; cada entry trae `fullUrl` y `resource`.
- `link[]`: URLs de navegación; la de `relation: "next"` te da la página siguiente. Paginar = seguir ese link hasta que no haya `next`.

Error común: hacer `GET /Patient?family=Perez` y tratar la respuesta como si fuera un Patient. No: es un Bundle; el paciente vive en `Bundle.entry[0].resource`.

### El viaje completo de un dato

Para consolidar (esto integra la Semana 1): tu app obtiene autorización (Tema 3), hace `GET [base]/Observation?patient=123&code=8867-4` con `Accept: application/fhir+json` y su token; el servidor responde `200 OK` con un Bundle searchset; tú navegas a `entry[0].resource.valueQuantity.value` y ahí está la frecuencia cardiaca. HTTP + rutas JSON: eso es implementar FHIR.

## Chuleta

| Quiero… | Hago… | Espero… |
|---------|-------|---------|
| Leer un paciente | `GET [base]/Patient/123` | 200 + Patient |
| Versión 1 | `GET [base]/Patient/123/_history/1` | 200 + Patient |
| Buscar | `GET [base]/Patient?family=Perez` | 200 + Bundle searchset |
| Crear | `POST [base]/Patient` (sin id) | 201 + Location |
| Reemplazar | `PUT [base]/Patient/123` (completo) | 200 (o 201 si creó) |
| Borrar | `DELETE [base]/Patient/123` | 200/204 (luego GET → 410) |
| Capacidades | `GET [base]/metadata` | CapabilityStatement |

- Idempotentes: GET, PUT, DELETE. No idempotente: POST.
- Headers: `Accept` (respuesta) / `Content-Type` (envío) = `application/fhir+json`.
- Prefijos: eq ne gt lt **ge le** (pegados al valor).
- Control: `_count`, `_sort`, `_include`.
- 400 sintaxis · 401 sin autenticar · 403 sin permiso · 404 no existe · 410 borrado · 422 inválido.

## Autoevaluación (sin mirar arriba)

1. ¿Qué diferencia hay entre read y search, y qué devuelve cada uno?
2. ¿Por qué PUT es idempotente y POST no? Da un ejemplo del riesgo.
3. Un servidor responde 422 a tu POST de Patient. ¿Qué significa y en qué se diferencia de un 400?
4. Escribe la búsqueda de observaciones con código LOINC 8867-4 desde el 1 de enero de 2024, máximo 5 por página.
5. ¿Cómo obtienes la siguiente página de resultados de una búsqueda?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 2 HTTP y REST".
2. Añade estos enlaces oficiales como fuentes:
   - http://hl7.org/fhir/R4/http.html — la API REST de FHIR R4: interacciones, verbos, códigos de estado.
   - http://hl7.org/fhir/R4/search.html — especificación completa de búsqueda: parámetros, prefijos, _include.
   - http://hl7.org/fhir/R4/bundle.html — el recurso Bundle: searchset, entry, links de paginación.
   - http://hl7.org/fhir/R4/operationoutcome.html — cómo reportan errores los servidores FHIR.
   - https://hapi.fhir.org/baseR4 — servidor público de práctica para probar todo lo anterior (solo datos ficticios).
3. Prompts sugeridos:
   - "Simula ser un servidor FHIR: yo te mando peticiones HTTP y tú respondes con el código de estado y cuerpo que corresponda, explicando por qué."
   - "Hazme 10 preguntas tipo examen sobre idempotencia, códigos de estado y la diferencia entre read, vread y search."
   - "Dame 5 búsquedas FHIR mal escritas (errores sutiles de prefijos, parámetros o rutas) y pídeme corregirlas una por una."

---

### Respuestas

1. read pide UN recurso concreto por id (`GET /Patient/123`) y devuelve ese recurso; search consulta por criterios (`GET /Patient?family=Perez`) y devuelve SIEMPRE un Bundle searchset, tenga 0, 1 o mil resultados.
2. Repetir PUT deja el recurso en el mismo estado final (reemplazo completo); cada POST crea un recurso nuevo, así que reintentar un POST por un fallo de red puede duplicar pacientes.
3. 422 = el JSON llegó bien formado pero el recurso viola reglas FHIR o del perfil (contenido inválido); 400 = la petición misma está mal formada (sintaxis rota, parámetro ilegal).
4. `GET [base]/Observation?code=8867-4&date=ge2024-01-01&_count=5`
5. Siguiendo la URL del `link` con `relation: "next"` del Bundle, hasta que ya no haya link next.
