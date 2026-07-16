# SMART on FHIR en práctica: App Launch, Backend Services y Bulk Data

> **En simple:** SMART on FHIR es el manual de cortesía para entrar a la casa de los datos clínicos. Hay dos puertas: la del frente, donde una persona autoriza a una app con su consentimiento (App Launch), y la de servicio, donde un sistema confiable entra de madrugada con una llave criptográfica para hacer trabajo masivo (Backend Services + Bulk Data). Este tema recorre ambos flujos byte por byte, con los parámetros exactos, los JWT reales y los errores que verás en producción.

## El mapa: perfiles SMART y descubrimiento

SMART App Launch (versión vigente 2.2, sobre FHIR R4) estandariza cómo se aplica OAuth 2.0 y OpenID Connect al mundo FHIR. Si necesitas repasar OAuth2/JWT en abstracto, vuelve al tema 3; aquí asumimos ese vocabulario (authorization server, resource server, client, grant, bearer token, firma asimétrica).

Los dos perfiles que debes dominar:

- **App Launch** (usuario presente): una app —dentro del EHR (*EHR launch*) o independiente (*standalone launch*)— obtiene un token acotado a un paciente o usuario, con su consentimiento explícito. Grant: `authorization_code` + PKCE.
- **Backend Services** (sistema a sistema, sin usuario): un proceso confiable se autentica con un JWT firmado con su clave privada y obtiene un token con scopes `system/`. Grant: `client_credentials` con `client_assertion`. Es la base de autenticación de **Bulk Data**.

Todo empieza por el descubrimiento. Un servidor SMART publica su configuración en:

```
GET [base]/.well-known/smart-configuration
```

```json
{
  "authorization_endpoint": "https://auth.ejemplo.sv/authorize",
  "token_endpoint": "https://auth.ejemplo.sv/token",
  "token_endpoint_auth_methods_supported": ["private_key_jwt"],
  "grant_types_supported": ["authorization_code", "client_credentials"],
  "scopes_supported": ["openid", "fhirUser", "launch", "launch/patient", "patient/*.rs", "system/*.rs", "offline_access"],
  "code_challenge_methods_supported": ["S256"],
  "capabilities": ["launch-ehr", "launch-standalone", "client-public", "client-confidential-asymmetric", "context-ehr-patient", "permission-v2"]
}
```

Léelo siempre antes de programar: `capabilities` te dice qué flujos y scopes soporta realmente el servidor (por ejemplo, `permission-v2` = scopes v2).

## App Launch de extremo a extremo

### Registro de la app

Antes de cualquier flujo, la app se registra ante el authorization server y queda fijado: su `client_id`, sus `redirect_uri` exactas (la comparación es literal, sin comodines), su tipo (pública: SPA/móvil, sin secreto; confidencial: backend que puede custodiar claves) y los scopes máximos que podrá pedir.

### Paso 1: petición de autorización

La app redirige el navegador al `authorization_endpoint`:

```
GET https://auth.ejemplo.sv/authorize?
    response_type=code&
    client_id=app-vitales-sv&
    redirect_uri=https://app.salud.gob.sv/callback&
    scope=launch/patient patient/Observation.rs patient/Patient.r openid fhirUser offline_access&
    state=af0ifjsldkj&
    aud=https://fhir.salud.gob.sv/r4&
    code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
    code_challenge_method=S256
```

Parámetros que el examen y la vida real te van a cobrar:

| Parámetro | Papel |
|---|---|
| `response_type=code` | Pide el grant authorization code |
| `client_id` | Identidad registrada de la app |
| `redirect_uri` | A dónde vuelve el navegador; debe coincidir EXACTO con lo registrado |
| `scope` | Permisos solicitados (espacios separan) |
| `state` | Valor aleatorio anti-CSRF; la app lo verifica al volver |
| `aud` | La base FHIR a la que se accederá; evita que un token bueno se use contra otro servidor |
| `launch` | Solo en EHR launch: token opaco que ata la sesión del EHR al contexto |
| `code_challenge` + `code_challenge_method=S256` | PKCE: hash del secreto efímero `code_verifier` |

El usuario ve la **pantalla de consentimiento** ("Esta app quiere leer tus signos vitales") y aprueba o recorta permisos.

### Paso 2: código por token (con PKCE)

El navegador vuelve a `redirect_uri?code=...&state=...`. La app valida `state` y canjea el código:

```
POST https://auth.ejemplo.sv/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=SplxlOBeZQQYbYS6WxSbIA&
redirect_uri=https://app.salud.gob.sv/callback&
client_id=app-vitales-sv&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

PKCE cierra el hueco clásico: si alguien intercepta el `code`, no puede canjearlo sin el `code_verifier` original (el servidor compara su S256 contra el `code_challenge` del paso 1). En SMART 2.x, PKCE es obligatorio para clientes públicos y recomendado para todos.

Respuesta:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "launch/patient patient/Observation.rs patient/Patient.r openid fhirUser offline_access",
  "refresh_token": "eyJyZWZyZXNo...",
  "patient": "pac-123",
  "id_token": "eyJpZF90b2tlbi..."
}
```

### Paso 3: launch context, uso y refresh

El **launch context** viaja junto al token: `patient` (el paciente en contexto, pedido con el scope `launch/patient` en standalone o resuelto por el parámetro `launch` en EHR launch), `encounter`, y desde 2.2 `fhirContext` (lista genérica de referencias en contexto, p. ej. una `List` o un `DiagnosticReport`). El `id_token` (scopes `openid fhirUser`) identifica QUIÉN es el usuario: su claim `fhirUser` apunta a `Practitioner/...`, `Patient/...`, etc.

Uso del token, igual que siempre:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://fhir.salud.gob.sv/r4/Observation?patient=pac-123&category=vital-signs&_sort=-date&_count=10"
```

Cuando expira (`expires_in`), si pediste `offline_access` tienes `refresh_token`:

```
POST /token
grant_type=refresh_token&refresh_token=eyJyZWZyZXNo...&client_id=app-vitales-sv
```

`online_access` es la variante que solo refresca mientras la sesión del usuario siga viva.

## Scopes v2 a fondo

SMART 2.x reemplazó los scopes v1 (`.read`/`.write`/`.*`) por la sintaxis granular `.cruds`:

| Concepto | v1 | v2 |
|---|---|---|
| Leer observaciones del paciente en contexto | `patient/Observation.read` | `patient/Observation.rs` |
| Todo sobre pacientes, como usuario | `user/Patient.*` | `user/Patient.cruds` |
| Escritura sin lectura (buzón de resultados) | no expresable | `system/Observation.c` |
| Semántica | read = read+search; write = create+update+delete | letras independientes: `c`reate, `r`ead, `u`pdate, `d`elete, `s`earch |

Detalles expertos:

- Las letras van **siempre en orden `c-r-u-d-s`** (`Observation.rs`, nunca `.sr`).
- Los tres contextos: `patient/` (acotado al paciente del launch context), `user/` (lo que el usuario puede ver), `system/` (sin usuario; exclusivo de Backend Services).
- **Parámetros embebidos** (granularidad fina): `patient/Observation.rs?category=http://terminology.hl7.org/CodeSystem/observation-category|vital-signs` limita el scope a un subconjunto definido por parámetros de búsqueda. Soporte aún desigual entre servidores: verifica `capabilities`.
- Scopes especiales: `openid` + `fhirUser` (identidad del usuario), `launch` (EHR launch), `launch/patient` y `launch/encounter` (pedir contexto en standalone), `offline_access` / `online_access` (refresh tokens).
- El servidor puede **conceder menos de lo pedido**: el campo `scope` de la respuesta del token es el contrato real. Compáralo siempre.

## Backend Services de extremo a extremo

Sin usuario no hay pantalla de consentimiento: la confianza se establece por registro previo + criptografía asimétrica.

### Preparación: claves y JWKS

1. Generas un par de claves (recomendado RS384 o ES384; los servidores deben soportar ambos):

```bash
openssl genrsa -out privada.pem 4096
openssl rsa -in privada.pem -pubout -out publica.pem
```

2. Publicas la clave pública como **JWKS** (JSON Web Key Set) en una URL https estable, con `kid` (key id):

```json
{"keys": [{"kty": "RSA", "kid": "clave-2026-01", "alg": "RS384", "n": "...", "e": "AQAB"}]}
```

3. Registras el cliente ante el authorization server entregando la **URL del JWKS** (mejor que el JWKS estático: permite rotar claves sin re-registro) y los scopes `system/` autorizados.

### El client assertion JWT

Para pedir token, construyes y firmas un JWT con tu clave privada:

```json
// Header
{"alg": "RS384", "kid": "clave-2026-01", "typ": "JWT"}
// Payload
{
  "iss": "cliente-epi-nacional",
  "sub": "cliente-epi-nacional",
  "aud": "https://auth.ejemplo.sv/token",
  "exp": 1783206000,
  "jti": "9f6c2c40-6a1f-4dbb-a1f7-simulado"
}
```

Reglas de hierro: `iss` = `sub` = tu `client_id`; `aud` = la URL **exacta del token endpoint** (no la base FHIR); `exp` a lo sumo **5 minutos** en el futuro; `jti` único por assertion (el servidor puede rechazar repetidos para frenar replay).

### Token request y uso

```
POST https://auth.ejemplo.sv/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
scope=system/Patient.rs system/Observation.rs&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion=eyJhbGciOiJSUzM4NCIs...
```

Respuesta típica: `access_token` de vida corta (~5 minutos), `token_type: bearer` y el `scope` concedido. Como los tokens duran poco, tu cliente debe **pedir uno nuevo por ciclo de trabajo**, no cachearlos por horas.

**Rotación de claves**: publica la clave nueva en el JWKS junto a la vieja (dos `kid`), empieza a firmar con la nueva, y retira la vieja tras un periodo de gracia. Nunca borres y publiques en el mismo instante: los tokens en vuelo y cachés de JWKS te romperán la madrugada.

## Bulk Data 2.0: export poblacional

Backend Services existe sobre todo para esto: extraer poblaciones completas de forma asíncrona (reportes epidemiológicos nocturnos, alimentar el lago de datos, sincronizar registros nacionales).

### Kick-off, polling y manifiesto (Async Request Pattern)

```
GET [base]/Group/grupo-diabetes/$export?_type=Patient,Observation&_since=2026-01-01T00:00:00Z
Authorization: Bearer <token system/...>
Accept: application/fhir+json
Prefer: respond-async
```

Niveles: `[base]/$export` (todo el sistema), `[base]/Patient/$export` (todos los pacientes), `[base]/Group/[id]/$export` (una cohorte definida). El servidor responde `202 Accepted` con un header `Content-Location`: la URL de estado.

Polling:

```
GET <url-de-estado>
-> 202 Accepted + X-Progress: "45% complete" + Retry-After: 120   (sigue esperando; respeta Retry-After)
-> 200 OK + manifiesto JSON                                        (terminó)
```

```json
{
  "transactionTime": "2026-07-15T02:00:00Z",
  "request": ".../Group/grupo-diabetes/$export?_type=Patient,Observation",
  "requiresAccessToken": true,
  "output": [
    {"type": "Patient", "url": "https://.../descargas/patient_1.ndjson", "count": 45210},
    {"type": "Observation", "url": "https://.../descargas/obs_1.ndjson", "count": 812445}
  ],
  "error": []
}
```

Descargas en **NDJSON** (un recurso por línea; `Accept: application/fhir+ndjson`), con el token si `requiresAccessToken` es `true`. Un `DELETE` a la URL de estado cancela el export o libera los archivos al terminar. El array `error` trae archivos NDJSON de `OperationOutcome`: revísalo siempre; un export "exitoso" puede traer fallas parciales.

Nota la simetría con el tema 8: Bulk Data exporta NDJSON, el import de GCP ingiere NDJSON. Es el mismo formato en ambas direcciones de la tubería nacional.

### Sandboxes para practicar

- https://launch.smarthealthit.org — simulador de App Launch: lanza tu app como si un EHR la invocara, con pacientes de prueba y pantalla de consentimiento simulada.
- https://bulk-data.smarthealthit.org/ — servidor de referencia de Bulk Data: registras tu JWKS (o dejas que genere el par por ti), te da un `client_id` y practicas el flujo Backend Services completo. La práctica de este tema lo usa con un script Python real.

## Errores comunes y gotchas

- **`invalid_client` por `aud` equivocado**: pusiste la base FHIR como `aud` del client assertion. Debe ser la URL exacta del **token endpoint** (con o sin barra final según la publique el servidor: cópiala literal del smart-configuration).
- **`exp` demasiado lejano**: assertions con vida > 5 minutos se rechazan. Genera el JWT justo antes de cada token request; no lo reutilices.
- **Algoritmo no soportado**: firmaste con RS256 y el servidor solo acepta RS384/ES384 (o viceversa). Consulta `token_endpoint_auth_signing_alg_values_supported` en el smart-configuration.
- **`kid` que no coincide**: rotaste claves pero el JWKS publicado aún no tiene el `kid` nuevo, o el servidor cachea tu JWKS viejo. Publica antes de firmar y da periodo de gracia.
- **Reloj desviado**: 2 minutos de desfase en tu servidor hacen que `exp`/`iat` parezcan inválidos. NTP no es opcional.
- **`invalid_scope` / scope recortado en silencio**: pediste `system/*.rs` y el registro solo autoriza `system/Patient.rs`. Lee el `scope` de la RESPUESTA, no asumas el de la petición.
- **`redirect_uri` casi igual**: `https://app/callback` vs `https://app/callback/`. La comparación es exacta; registra y usa la misma cadena.
- **Ignorar `state`**: si no lo generas y verificas, tu app es vulnerable a CSRF de autorización. Los revisores de seguridad lo buscan primero.
- **Martillar la URL de estado del export**: polling sin respetar `Retry-After` te gana un `429`. Implementa espera con el valor del header más jitter.
- **Olvidar `Prefer: respond-async`** en el kick-off: algunos servidores responden 4xx directamente; otros intentan procesar en línea y explotan por timeout.

## Nivel experto

- **Token introspection (RFC 7662)**: SMART 2.x define cómo un resource server consulta al authorization server si un token sigue activo y con qué scopes/contexto. Clave cuando el servidor FHIR y el de autorización son sistemas separados, como será en la red nacional.
- **Autenticación asimétrica también para apps confidenciales de App Launch**: `private_key_jwt` (el mismo client assertion de Backend Services) es preferible al `client_secret_basic` histórico; los secretos compartidos no rotan bien entre instituciones.
- **`fhirContext` (2.2)** generaliza el contexto de lanzamiento más allá de patient/encounter: útil para lanzar apps sobre una orden, un reporte o un episodio concreto.
- **Grupos como cohortes vivas**: en Bulk Data nacional, el `Group/[id]/$export` con grupos gestionados por criterios (diabéticos, embarazadas) convierte el export en un mecanismo de vigilancia epidemiológica reproducible.
- **`_typeFilter`** permite filtrar el export con parámetros de búsqueda por tipo; su soporte es opcional: negócialo con el CapabilityStatement y la documentación del servidor antes de diseñarlo en tu pipeline.
- **Presupuesto de seguridad**: assertions de 5 minutos, tokens de 5-10 minutos, JWKS con rotación trimestral, `jti` almacenado contra replay, TLS 1.2+ en todo, y auditoría de cada token emitido (quién, qué scopes, cuándo). Ese es el estándar que debes exigir a proveedores en la institución.
- **Errores como contrato**: OAuth devuelve errores estructurados (`error`, `error_description`). Registra ambos en tus logs de integración; "no funciona el token" no es diagnóstico.

## Chuleta

| Necesito | Dato |
|---|---|
| Descubrir endpoints | `GET [base]/.well-known/smart-configuration` |
| Authorize (App Launch) | `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `aud`, `launch` (EHR), PKCE `code_challenge` S256 |
| Canjear código | `POST token`: `grant_type=authorization_code` + `code` + `redirect_uri` + `code_verifier` |
| Contexto de paciente | Campo `patient` junto al token; scopes `launch/patient`, `fhirContext` en 2.2 |
| Refresh | `offline_access` -> `grant_type=refresh_token` |
| Scope v2 | `contexto/Recurso.cruds` en orden c-r-u-d-s; ej. `patient/Observation.rs` |
| Identidad del usuario | `openid fhirUser` -> `id_token.fhirUser` = `Practitioner/...` |
| Client assertion | JWT RS384/ES384: `iss`=`sub`=client_id, `aud`=token endpoint, `exp`≤5 min, `jti` único |
| Token request backend | `grant_type=client_credentials` + `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer` + `client_assertion` |
| Kick-off export | `GET [base]/Group/[id]/$export` + `Prefer: respond-async` -> `202` + `Content-Location` |
| Polling | `202` + `Retry-After` (esperar) -> `200` + manifiesto (`output[].url`, `requiresAccessToken`) |
| Formato de archivos | NDJSON (`application/fhir+ndjson`), un recurso por línea |
| Cancelar export | `DELETE` a la URL de estado |
| Sandboxes | launch.smarthealthit.org (App Launch) · bulk-data.smarthealthit.org (Backend Services/Bulk) |

## Autoevaluacion

1. Enumera los parámetros obligatorios de la petición de autorización de App Launch y explica el papel de `state`, `aud` y PKCE.
2. ¿Qué diferencia hay entre `patient/Observation.rs`, `user/Observation.rs` y `system/Observation.rs`? ¿Quién usa cada uno?
3. Construye mentalmente el client assertion de Backend Services: los 5 claims, el valor correcto de `aud` y el límite de `exp`.
4. El token endpoint te devuelve `invalid_client`. Da tres causas plausibles ordenadas por probabilidad y cómo descartas cada una.
5. Describe el Async Request Pattern de Bulk Data desde el kick-off hasta tener los NDJSON en disco, incluyendo los códigos HTTP y headers clave.
6. Diseña el scope mínimo para: (a) app de paciente que solo muestra sus vacunas; (b) proceso nocturno que exporta pacientes y observaciones de una cohorte.
7. ¿Por qué la respuesta del token trae un campo `scope` y qué debes hacer con él?
8. Explica cómo rotar la clave de un cliente Backend Services sin interrumpir los exports nocturnos.

### Respuestas

1. `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `aud` (+`launch` en EHR launch, +`code_challenge`/`method` con PKCE). `state`: anti-CSRF, la app verifica que vuelve idéntico. `aud`: fija contra qué servidor FHIR valdrá el token. PKCE: el `code_verifier` demuestra que quien canjea el código es quien inició el flujo.
2. `patient/`: acotado al paciente del launch context (apps de paciente o clínicas centradas en un caso). `user/`: lo que el usuario autenticado puede ver en general (portales de profesionales). `system/`: sin usuario, procesos de sistema vía Backend Services.
3. `iss` y `sub` = client_id; `aud` = URL exacta del token endpoint; `exp` ≤ 5 minutos; `jti` único. Firmado RS384 (o ES384) con header `kid` que exista en el JWKS publicado.
4. (a) `aud` apunta a la base FHIR y no al token endpoint — compara con smart-configuration; (b) `kid`/JWKS desalineados tras rotación — verifica que el JWKS público contiene la clave que firma; (c) `exp` vencido o reloj desviado — regenera el JWT y revisa NTP.
5. Kick-off `GET .../$export` con `Prefer: respond-async` -> `202` + `Content-Location`. Polling a esa URL: `202` con `Retry-After`/`X-Progress` mientras corre; `200` con manifiesto al terminar (`output[]` con URLs y counts, `requiresAccessToken`, `error[]`). Descarga NDJSON con el bearer token; `DELETE` a la URL de estado para limpiar.
6. (a) `patient/Immunization.rs` (+`launch/patient openid fhirUser` para contexto e identidad). (b) `system/Patient.rs system/Observation.rs` sobre `Group/[cohorte]/$export`.
7. Es el contrato real: el servidor puede conceder menos de lo pedido. La app debe leerlo y degradar funcionalidad (u abortar) si falta un scope crítico, en vez de fallar después con 403 confusos.
8. Publicar la clave nueva en el JWKS junto a la vieja (dos `kid`), firmar las nuevas assertions con la nueva, esperar el periodo de gracia (cachés y tokens en vuelo) y retirar la vieja del JWKS.

## Para profundizar

- SMART App Launch (especificación completa, incluye Backend Services y scopes): http://hl7.org/fhir/smart-app-launch/
- Sandbox de App Launch de SMART Health IT: https://launch.smarthealthit.org
- Servidor de referencia de Bulk Data: https://bulk-data.smarthealthit.org/
- API REST de FHIR R4 (operaciones y Async Request Pattern base): http://hl7.org/fhir/R4/
- Inferno (suite de pruebas de conformidad SMART/Bulk usada en certificación de EHRs en EE. UU.): https://inferno.healthit.gov/
- US Core (los perfiles que las apps SMART suelen consumir): https://hl7.org/fhir/us/core/
