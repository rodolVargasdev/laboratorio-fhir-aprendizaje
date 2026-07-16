# APIs y HTTP: el idioma de FHIR

> **En simple:** una API es la ventanilla de un banco. Tú no entras a la bóveda a sacar el dinero: llegas a la ventanilla, llenas un formulario con un formato exacto y el cajero te entrega el resultado. HTTP es el idioma en que se llenan esos formularios en la web. FHIR es, ante todo, una API que habla HTTP: si dominas HTTP, ya entiendes la mitad de FHIR.

## Cliente y servidor: quién pide y quién responde

Toda la web funciona con un mismo patrón: un **cliente** que pide y un **servidor** que responde. El cliente puede ser tu navegador, una app de celular, un script en Python o el expediente clínico de un hospital. El servidor es un programa siempre escuchando, que guarda los datos y responde a peticiones bien formadas.

La analogía del restaurante fija los roles:

- **Tú (cliente)** no entras a la cocina: pides desde tu mesa.
- **El menú (la API)** define qué puedes pedir y en qué términos exactos.
- **El mesero (HTTP)** lleva tu pedido con un formato fijo y trae la respuesta con otro formato fijo.
- **La cocina (el servidor)** prepara el resultado. Cómo lo hace por dentro no te importa.

Ese es el punto clave de una API (*Application Programming Interface*): es un **contrato**. Define qué se puede pedir, con qué formato y qué forma tendrá la respuesta. La implementación interna del servidor (base de datos, lenguaje) es invisible para el cliente. Por eso un hospital con un sistema en Java puede intercambiar pacientes con un laboratorio hecho en Python: ambos respetan el mismo contrato.

Cada intercambio es una pareja **petición -> respuesta**. El cliente siempre inicia, y cada pareja es independiente de la anterior: HTTP no recuerda conversaciones pasadas (volveremos a esto con REST).

## Anatomía de una URL

La URL es la dirección exacta de lo que pides. Merece que la disecciones pieza por pieza, porque en FHIR vas a construir URLs a mano todos los días. Tomemos una real:

```
https://hapi.fhir.org/baseR4/Patient?name=garcia&_count=5
```

| Pieza | Valor | Qué significa |
|---|---|---|
| Esquema | `https://` | Protocolo a usar. `https` es HTTP cifrado con TLS; nunca envíes datos de salud por `http` a secas. |
| Host | `hapi.fhir.org` | El nombre del servidor. El DNS lo traduce a una dirección IP. |
| Puerto | (implícito `443`) | La "puerta" del servidor. `https` usa 443 por defecto y `http` usa 80, por eso casi nunca lo escribes. Si vieras `hapi.fhir.org:8080`, el puerto sería 8080. |
| Path (ruta) | `/baseR4/Patient` | Qué recurso pides dentro del servidor. Aquí: la colección de pacientes del servidor FHIR R4. |
| Query string | `?name=garcia&_count=5` | Parámetros que afinan la petición. |

La **query string** tiene su propia gramática:

- Empieza con `?` (un solo `?`, siempre el primero).
- Cada parámetro es una pareja `clave=valor`: `name=garcia`.
- Los parámetros se separan con `&`: `name=garcia&_count=5`.

Leída completa, la URL dice: "por HTTPS, al servidor `hapi.fhir.org`, en su base FHIR R4, dame pacientes cuyo nombre contenga *garcia*, máximo 5". En FHIR, el path identifica el **tipo de recurso** (`Patient`, `Observation`) o una **instancia concreta** (`Patient/123`), y la query string expresa la **búsqueda**. Esa división es la columna vertebral de la API REST de FHIR.

Detalle práctico: los espacios y caracteres especiales se codifican en la URL (un espacio se vuelve `%20`). Las herramientas suelen hacerlo por ti; cuando veas `%` en una URL, eso es lo que pasa.

## Métodos HTTP: los verbos de la conversación

La URL dice **qué** recurso; el método (o verbo) dice **qué quieres hacer** con él. Cinco verbos cubren casi todo, y FHIR les asigna un significado preciso:

| Método | Idea general | En FHIR | Ejemplo |
|---|---|---|---|
| GET | Leer, sin modificar nada | Leer un recurso o buscar | `GET /Patient/123` trae ese paciente |
| POST | Crear algo nuevo | Crear un recurso; el servidor asigna el id | `POST /Patient` con el JSON del paciente en el cuerpo |
| PUT | Reemplazar por completo | Actualizar un recurso enviándolo entero | `PUT /Patient/123` sustituye al paciente 123 con lo que envíes |
| PATCH | Modificar parcialmente | Cambiar solo algunos campos | `PATCH /Patient/123` para corregir solo el teléfono |
| DELETE | Borrar | Eliminar el recurso | `DELETE /Patient/123` |

Tres matices que separan al principiante del profesional:

1. **GET es seguro**: por contrato, nunca modifica datos en el servidor. Por eso el navegador puede hacer GET libremente al escribir una URL, y por eso los buscadores pueden recorrer la web sin romper nada.
2. **PUT reemplaza, no fusiona.** Si el paciente 123 tiene nombre, teléfono y dirección, y tú haces `PUT` enviando solo el nombre, acabas de borrar el teléfono y la dirección. Para tocar un solo campo sin riesgo, existe PATCH.
3. **POST no lleva id en la URL; PUT sí.** Con POST le dices al servidor "crea esto y asígnale tú un id". Con PUT le dices "el recurso con ESTE id debe quedar exactamente así".

## Headers: los metadatos de la petición

Además del método y la URL, cada petición y cada respuesta llevan **headers** (cabeceras): parejas `Nombre: valor` que describen el mensaje sin ser parte del contenido. Es la información del sobre, no de la carta. Tres headers te importan desde ya:

- **`Accept`** (en la petición): qué formato quieres recibir. En FHIR: `Accept: application/fhir+json`.
- **`Content-Type`** (en la petición cuando envías cuerpo, y en toda respuesta con cuerpo): qué formato tiene el contenido que viaja. Si haces POST de un paciente en JSON, declaras `Content-Type: application/fhir+json`.
- **`Authorization`** (en la petición): tus credenciales. Lo habitual en FHIR es `Authorization: Bearer <token>`, donde el token es una credencial temporal que obtuviste antes (lo verás a fondo con OAuth2).

¿Qué es exactamente `application/fhir+json`? Es un **media type** (tipo MIME): una etiqueta estandarizada de formato. `application/json` es "JSON genérico"; `application/fhir+json` es "JSON que además cumple las reglas de FHIR" (el sufijo `+json` indica que cualquier parser JSON puede leerlo). Los servidores FHIR suelen aceptar ambos, pero el correcto y explícito es `application/fhir+json`, útil sobre todo cuando el servidor también soporta XML.

## Códigos de estado: la respuesta en un número

Toda respuesta HTTP empieza con un código de tres dígitos que resume el resultado. El primer dígito es la familia:

- **1xx** informativo (raro en la práctica diaria).
- **2xx** éxito.
- **3xx** redirección: lo que buscas está en otra parte.
- **4xx** error del **cliente**: tu petición tiene un problema.
- **5xx** error del **servidor**: tu petición pudo estar bien, pero el servidor falló.

La regla de oro para depurar: **4xx -> revisa tu petición; 5xx -> el problema está del otro lado** (reporta o reintenta más tarde). Estos son los doce códigos que verás una y otra vez trabajando con FHIR:

| Código | Nombre | Qué significa | Qué hacer |
|---|---|---|---|
| 200 | OK | Éxito; la respuesta trae el contenido pedido | Procesar el cuerpo |
| 201 | Created | Se creó el recurso (típico tras POST) | Leer el header `Location` para conocer la URL del nuevo recurso |
| 204 | No Content | Éxito, pero sin cuerpo (típico tras DELETE) | Nada que parsear; la operación funcionó |
| 301 | Moved Permanently | El recurso vive en otra URL para siempre | Actualizar tus URLs a la nueva dirección |
| 304 | Not Modified | El recurso no cambió desde tu última copia | Usar tu copia en caché; no hay cuerpo nuevo |
| 400 | Bad Request | Petición malformada (JSON inválido, parámetro roto) | Corregir la sintaxis de la petición antes de reintentar |
| 401 | Unauthorized | No presentaste credenciales válidas | Obtener o renovar el token y repetir |
| 403 | Forbidden | Te identificaste, pero no tienes permiso para ESO | No reintentar igual; revisar los permisos asignados |
| 404 | Not Found | El recurso o la ruta no existe | Verificar la URL y el id; en FHIR, leer el OperationOutcome |
| 409 | Conflict | La petición choca con el estado actual (dos ediciones simultáneas) | Releer el recurso actual y decidir cómo resolver |
| 422 | Unprocessable Entity | Sintaxis correcta, pero el contenido viola reglas de negocio (en FHIR: falló la validación del recurso) | Leer el OperationOutcome y corregir el recurso |
| 500 | Internal Server Error | El servidor se rompió procesando tu petición | No es culpa tuya; reintentar después o reportar |

Distinguir **401 de 403** te ahorrará horas: 401 es "no sé quién eres" (falta o expiró la credencial); 403 es "sé quién eres y no puedes hacer esto" (falta de permisos). Renovar el token arregla el 401; el 403 requiere que alguien te otorgue el permiso.

Y una idea que repetirás cuando dirijas integraciones: **un 404 no es una falla del sistema**. Es el sistema funcionando: preguntaste por algo que no existe y te lo dijo con precisión. Los servidores FHIR además acompañan los errores con un recurso llamado `OperationOutcome` que explica en detalle qué salió mal.

## Idempotencia: por qué reintentar sin miedo (o con miedo)

Una operación es **idempotente** si ejecutarla una vez o veinte veces deja al sistema en el mismo estado. El interruptor de "apagar la luz" es idempotente: púlsalo cinco veces y la luz sigue apagada. "Agregar un huevo a la mezcla" no lo es: cinco ejecuciones, cinco huevos.

Trasladado a HTTP:

- **GET** es idempotente (y además seguro): leer veinte veces no cambia nada.
- **PUT** es idempotente: "el paciente 123 debe quedar exactamente así" produce el mismo estado final se ejecute una vez o diez.
- **DELETE** es idempotente en cuanto al estado: tras el primer borrado, repetirlo no cambia nada más (aunque las repeticiones puedan responder 404 o 204 según el servidor).
- **POST no es idempotente**: cada ejecución crea un recurso nuevo. Diez POST del mismo paciente son diez pacientes duplicados.

¿Por qué importa? Porque **las redes fallan**. Envías una petición, se corta la conexión antes de la respuesta, y no sabes si el servidor la procesó. Reintentar un PUT es inocuo: el estado final es el mismo. Reintentar un POST a ciegas puede crear un paciente duplicado, y en un sistema nacional de salud eso significa historias clínicas partidas en dos. Por eso los sistemas serios reintentan automáticamente solo las operaciones idempotentes y tratan los POST con cuidado (verificando antes si el recurso existe, o con el *conditional create* de FHIR, que verás más adelante).

## JSON: el cuerpo de la conversación

El método, la URL y los headers son el sobre; el **cuerpo** (body) es la carta. En las APIs modernas, el cuerpo casi siempre es **JSON** (JavaScript Object Notation): texto plano con estructura de objetos `{ }`, listas `[ ]`, cadenas `" "`, números, `true`/`false` y `null`. Ya lo estudiaste en el tema anterior; aquí lo importante es dónde aparece:

- En un **GET** normalmente no envías cuerpo: todo va en la URL. La **respuesta** sí trae cuerpo: el recurso en JSON.
- En un **POST** o **PUT** envías el recurso completo en el cuerpo, y declaras su formato con `Content-Type`.

Así se ve un recurso FHIR real (recortado) como cuerpo de respuesta a `GET /Patient/ejemplo`:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo",
  "name": [
    {
      "family": "Garcia",
      "given": ["Maria"]
    }
  ],
  "birthDate": "1988-04-12"
}
```

Fíjate en `resourceType`: todo recurso FHIR en JSON declara qué tipo de recurso es. Cuando recibas una respuesta y no sepas qué te llegó, `resourceType` es lo primero que miras. Si buscas (por ejemplo `GET /Patient?name=garcia`), el `resourceType` de la respuesta no será `Patient` sino `Bundle`: un contenedor con la lista de resultados. Lo explorarás en la práctica.

## REST: el estilo que FHIR adoptó

REST (*Representational State Transfer*) no es un protocolo ni un producto: es un **estilo de diseño** de APIs sobre HTTP. Sus ideas centrales:

1. **Todo es un recurso con URL propia.** Un paciente, una observación, una cita: cada uno tiene dirección (`/Patient/123`, `/Observation/456`). Los sustantivos van en la URL.
2. **Los verbos son los de HTTP.** No inventas operaciones como `/getPatient` o `/borrarPaciente`: usas `GET /Patient/123` y `DELETE /Patient/123`. Los verbos van en el método, no en la ruta.
3. **Lo que viaja son representaciones.** No te llega "el paciente" (que vive en la base de datos): te llega una **representación** de su estado en un formato negociado, JSON o XML. De ahí el nombre del estilo.
4. **Sin estado (stateless).** Cada petición es autocontenida: lleva todo lo necesario (URL, headers, token). No hay "sesión abierta". Esto hace a los servidores fáciles de escalar (cualquier servidor de un clúster atiende tu siguiente petición) y a las peticiones fáciles de depurar: cada una se explica sola.

FHIR es una API REST casi de libro: recursos clínicos con URLs predecibles, verbos HTTP con semántica definida y representaciones en `application/fhir+json`.

## Tu primera API FHIR real

Nada de esto es teórico: hay un servidor FHIR público de pruebas, HAPI FHIR, disponible en `https://hapi.fhir.org/baseR4`. La petición de bienvenida a cualquier servidor FHIR es:

```
GET https://hapi.fhir.org/baseR4/metadata
```

La respuesta es un recurso llamado **CapabilityStatement**: la carta de presentación del servidor, un documento donde declara qué versión de FHIR habla, qué recursos maneja y qué operaciones permite sobre cada uno. Es el "menú del restaurante" en formato máquina. Antes de integrarte con cualquier servidor FHIR del mundo, tu primer movimiento siempre será pedir su `metadata`.

¿Con qué herramientas haces estas peticiones?

- **El navegador.** Escribir una URL y presionar Enter ejecuta un GET. Es la herramienta más inmediata, pero solo hace GET: no puedes elegir método, ni headers, ni enviar cuerpo.
- **curl.** Herramienta de línea de comandos disponible en Windows, macOS y Linux. Controla todo: método, headers, cuerpo. El GET básico contra HAPI:

  ```bash
  curl -H "Accept: application/fhir+json" "https://hapi.fhir.org/baseR4/Patient?_count=1"
  ```

  El flag `-H` agrega un header. Para otros métodos usarías `-X POST`, `-X PUT`, etc., y `-d` para el cuerpo. Las comillas alrededor de la URL importan: sin ellas, la terminal interpreta el `&` como otra cosa.
- **El Laboratorio de esta app.** Un cliente HTTP integrado que apunta a `https://hapi.fhir.org/baseR4`: escribes solo el path (por ejemplo `Patient?_count=2`) y ves el código de estado, los headers y el cuerpo formateado. Es donde harás la práctica de este tema.

## Errores comunes

- **Confundir la API con el servidor.** La API es el contrato (qué se puede pedir y cómo); el servidor es el programa que lo cumple. Dos servidores distintos pueden exponer la misma API, y eso es exactamente lo que hace posible la interoperabilidad FHIR.
- **Usar PUT para "actualizar un campo".** PUT reemplaza el recurso completo; si envías solo el campo que quieres cambiar, borras el resto. Para cambios parciales existe PATCH, o el ciclo leer con GET, modificar y reenviar completo con PUT.
- **Reintentar POST a ciegas ante un fallo de red.** POST no es idempotente: cada reintento puede crear un duplicado. Verifica primero si la operación anterior tuvo efecto.
- **Tratar el 404 como "el sistema falló".** 404 significa "eso no existe aquí": revisa el id y la URL. El sistema respondió correctamente.
- **Ignorar la diferencia entre 401 y 403.** Con 401, renueva credenciales; con 403, necesitas que te otorguen el permiso. Reintentar sin cambiar nada no arregla ninguno de los dos.
- **Olvidar el `?` o mezclar `?` y `&`.** El primer parámetro va tras `?`; los siguientes se unen con `&`. `Patient?name=garcia?_count=5` es una URL rota.
- **Enviar JSON sin `Content-Type`.** Algunos servidores lo rechazan con 400 o 415; declara siempre `Content-Type: application/fhir+json` cuando envíes un recurso.

## Nivel siguiente

Temas que tocan esta base y que estudiarás pronto; por ahora basta con ubicarlos:

- **HTTPS/TLS.** La "S" de `https` cifra el canal entre cliente y servidor. Con datos de salud no es opcional: toda API clínica seria rechaza conexiones sin cifrar. Más adelante verás certificados y por qué a veces fallan.
- **OAuth2 y SMART on FHIR.** El header `Authorization: Bearer <token>` presupone que alguien te dio un token. OAuth2 es el protocolo estándar para obtenerlo, y SMART on FHIR es el perfil de OAuth2 diseñado para aplicaciones de salud: define cómo una app pide permiso para leer, por ejemplo, solo los pacientes de un consultorio. Es tema obligado de las certificaciones HL7.
- **Paginación.** Cuando una búsqueda devuelve miles de resultados, el servidor los entrega por páginas. En FHIR, el `Bundle` de respuesta trae enlaces `next` para pedir la siguiente página, y parámetros como `_count` controlan el tamaño.
- **Versionado.** Los recursos FHIR tienen historial: cada actualización crea una versión nueva, y puedes pedir versiones anteriores con `GET /Patient/123/_history/2`. HTTP colabora con headers como `ETag` para detectar ediciones simultáneas (el origen de muchos 409).

## Chuleta

| Concepto | Resumen operativo |
|---|---|
| API | Contrato entre cliente y servidor: qué se pide, cómo y qué se recibe |
| URL | `esquema://host:puerto/path?clave=valor&clave2=valor2` |
| GET | Leer/buscar; seguro e idempotente; sin cuerpo en la petición |
| POST | Crear; NO idempotente; el servidor asigna el id; responde 201 |
| PUT | Reemplazar completo por id; idempotente |
| PATCH | Modificar parcialmente; envía solo los cambios |
| DELETE | Borrar; idempotente; suele responder 204 |
| `Accept` | Formato que quieres recibir: `application/fhir+json` |
| `Content-Type` | Formato de lo que envías o recibes en el cuerpo |
| `Authorization` | Credenciales: `Bearer <token>` |
| 2xx / 3xx | Éxito / redirección o caché |
| 4xx / 5xx | Error del cliente (revisa tu petición) / error del servidor |
| 401 vs 403 | Sin credenciales válidas vs sin permiso para esa acción |
| Idempotencia | Repetir la operación no cambia el resultado: GET, PUT, DELETE sí; POST no |
| REST | Recursos con URL + verbos HTTP + representaciones (JSON), sin sesión |
| `metadata` | `GET [base]/metadata` devuelve el CapabilityStatement del servidor |

## Autoevaluacion

Responde sin mirar la lección; luego compara con las respuestas.

1. En la URL `https://hapi.fhir.org:8080/baseR4/Patient?name=garcia&_count=5`, identifica esquema, host, puerto, path y los dos parámetros de la query string.
2. Necesitas corregir únicamente el número de teléfono de un paciente sin tocar el resto de sus datos. ¿Qué método usas y por qué NO usarías PUT enviando solo el teléfono?
3. Envías un POST para crear un paciente y la conexión se corta antes de recibir respuesta. ¿Por qué es arriesgado reintentar sin más, y por qué con PUT no lo sería?
4. Recibes un 403 tras enviar tu token. ¿Renovar el token resuelve el problema? Explica la diferencia con un 401.
5. ¿Qué le pides a un servidor FHIR desconocido para saber qué recursos y operaciones soporta, y cómo se llama el recurso que responde?
6. Un colega dice: "el sistema está caído, me devolvió un 404". ¿Qué le corriges?
7. ¿Qué diferencia hay entre `application/json` y `application/fhir+json`, y en qué header de la petición declaras el formato que quieres recibir?
8. ¿Por qué el hecho de que HTTP sea sin estado (stateless) facilita escalar un servidor FHIR nacional?

### Respuestas

1. Esquema `https`, host `hapi.fhir.org`, puerto `8080`, path `/baseR4/Patient`; parámetros: `name=garcia` y `_count=5`, introducidos por `?` y separados por `&`.
2. PATCH, porque modifica solo los campos enviados. PUT reemplaza el recurso completo: enviar solo el teléfono borraría el resto de los datos del paciente.
3. POST no es idempotente: si el servidor sí procesó la primera petición, el reintento crea un paciente duplicado. PUT es idempotente: repetirlo deja el mismo estado final, así que reintentar es seguro.
4. No. 403 significa que el servidor sabe quién eres pero no tienes permiso para esa acción; hay que otorgar el permiso. 401 significa credenciales ausentes o inválidas, y ese sí se resuelve renovando el token.
5. `GET [base]/metadata`; responde un CapabilityStatement, la declaración de capacidades del servidor.
6. 404 no indica caída: el servidor respondió correctamente que ese recurso o ruta no existe. Hay que revisar la URL o el id. Una caída se manifestaría como 5xx o como ausencia total de respuesta.
7. `application/fhir+json` es JSON que además cumple las reglas de FHIR; `application/json` es JSON genérico. El formato deseado de la respuesta se declara en el header `Accept`.
8. Como cada petición es autocontenida y el servidor no guarda sesiones, cualquier servidor de un clúster puede atender cualquier petición, lo que permite repartir la carga y agregar servidores sin coordinación de estado.

## Para profundizar

- [Visión general de HTTP (MDN)](https://developer.mozilla.org/es/docs/Web/HTTP/Overview) — el funcionamiento de HTTP explicado en español por la referencia web más confiable.
- [Códigos de estado HTTP (MDN)](https://developer.mozilla.org/es/docs/Web/HTTP/Status) — catálogo completo de códigos para consultar cada vez que veas uno nuevo.
- [Introducción a las APIs web (MDN)](https://developer.mozilla.org/es/docs/Learn/JavaScript/Client-side_web_APIs/Introduction) — qué es una API desde cero, con ejemplos del lado del cliente.
- [Servidor HAPI FHIR público](https://hapi.fhir.org/baseR4) — el servidor de pruebas contra el que practicarás; guárdalo en favoritos.
