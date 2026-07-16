# Seguridad: OAuth 2.0, JWT y SMART on FHIR

> **En simple:** los datos clínicos son de lo más sensible que existe, así que FHIR no inventa seguridad propia: adopta los estándares de la web (TLS, OAuth 2.0, OpenID Connect, JWT) y los perfila para salud con SMART on FHIR. Este tema te lleva del concepto (autenticación vs autorización) a la mecánica completa: authorization code con PKCE paso a paso, anatomía y validación de JWT, scopes v1 y v2, Backend Services para sistema-a-sistema, y las amenazas que un director de plataforma debe tener mapeadas.

## Autenticación vs autorización: la distinción que ordena todo

- **Autenticación (authn)**: demostrar **quién eres**. Analogía: mostrar el DUI en la entrada.
- **Autorización (authz)**: qué tienes **permitido hacer**. Analogía: tu boleto dice a qué zonas entras.

Puedes estar perfectamente autenticado y no autorizado. En HTTP la pareja se refleja en dos códigos que el examen ama: **401 Unauthorized** = fallo de autenticación (no hay token, es inválido o expiró); **403 Forbidden** = autenticado, pero sin permiso (tu scope no alcanza). El nombre de 401 es engañoso históricamente: descríbelo siempre como "no autenticado".

Tercera pata que suele olvidarse: **auditoría** (¿quién hizo qué y cuándo?). En FHIR la cubren `AuditEvent` (registro de accesos y operaciones) y `Provenance` (el origen y la cadena de custodia de un recurso). Sin auditoría no hay seguridad operable: es lo que te permite investigar el incidente que la authn/authz no evitó.

## OAuth 2.0 a fondo

OAuth 2.0 es un marco de **autorización delegada**: permite que una aplicación obtenga acceso limitado a recursos de un usuario **sin conocer su contraseña**, mediante un **access token** temporal. La identidad (autenticación del usuario final para la app) la aporta **OpenID Connect** encima de OAuth.

### Los cuatro roles

1. **Resource owner**: quien puede conceder el acceso (el paciente, el profesional).
2. **Client**: la aplicación que quiere acceso (tu app).
3. **Authorization server**: autentica al usuario, recoge su consentimiento y emite tokens.
4. **Resource server**: donde viven los datos; en nuestro mundo, **el servidor FHIR**, que valida el token de cada petición.

### Authorization code + PKCE, paso a paso

Es el flujo para apps con usuario (web, móvil, SPA). PKCE (Proof Key for Code Exchange) es obligatorio en SMART 2.x y elimina el riesgo de intercepción del código. El diagrama en texto:

```
 Navegador del usuario          Authorization Server               App (client)          Servidor FHIR
        |                              |                                |                     |
 1      |<--- redirección con client_id, redirect_uri, scope, state,---|                     |
        |     code_challenge=S256(code_verifier)                        |                     |
 2      |---- usuario se autentica y aprueba los scopes --------------->|                     |
 3      |<--- redirect a redirect_uri con ?code=XYZ&state=... ----------|                     |
 4      |---- entrega code a la app ----------------------------------->|                     |
 5      |                              |<-- POST /token: code, redirect_uri,                 |
        |                              |    client_id, code_verifier ---|                     |
 6      |                              |--- { access_token, expires_in, |                     |
        |                              |      refresh_token?, id_token?, scope } -->|         |
 7      |                              |                                |-- GET /Observation  |
        |                              |                                |   Authorization:    |
        |                              |                                |   Bearer <token> -->|
 8      |                              |                                |<-- 200 + recursos --|
```

Piezas del flujo que debes poder explicar:

- **`state`**: valor aleatorio que la app genera en (1) y verifica en (3); defensa contra CSRF.
- **`code_verifier`/`code_challenge`**: la app genera un secreto efímero, manda su hash (S256) al autorizar y el secreto original al canjear; quien robe solo el `code` no puede canjearlo.
- **`redirect_uri`**: debe estar **pre-registrado exactamente**; es la defensa contra redirecciones abiertas.
- **Access token**: vida corta (minutos a una hora). Viaja SIEMPRE en `Authorization: Bearer <token>`, nunca en la URL.
- **Refresh token**: credencial de larga vida para pedir nuevos access tokens sin molestar al usuario. Se guarda con máximo cuidado; en SMART se solicita con los scopes `offline_access` (sobrevive a la sesión) u `online_access`.
- **Client credentials**: el otro grant relevante: sin usuario, el cliente se autentica a sí mismo y recibe un token con permisos de sistema. Es la base de Backend Services (abajo).

## JWT y OpenID Connect

### Anatomía de un JWT

Muchos access tokens (y todos los id_token y las client assertions) son **JWT** (JSON Web Token): tres partes en base64url separadas por puntos:

```
header.payload.signature
```

```json
// header
{ "alg": "RS256", "typ": "JWT", "kid": "clave-2026-01" }
// payload (claims)
{
  "iss": "https://auth.salud.gob.sv",
  "sub": "usuario-123",
  "aud": "https://fhir.salud.gob.sv",
  "exp": 1783728000,
  "iat": 1783724400,
  "scope": "patient/Observation.rs"
}
```

Claims esenciales: `iss` (quién lo emitió), `sub` (sujeto), `aud` (para quién es), `exp`/`iat` (expiración/emisión, epoch Unix), más `jti` (id único, anti-replay). El `kid` del header indica **qué clave** verifica la firma (se resuelve contra el JWKS del emisor).

### RS256 vs HS256, y por qué la firma lo es todo

- **HS256**: firma **simétrica** (HMAC): la misma clave firma y verifica. Todo verificador puede también FIRMAR: solo sirve entre partes que comparten secreto de forma segura.
- **RS256** (y ES256/RS384...): firma **asimétrica**: se firma con la clave privada y se verifica con la pública (publicada vía JWKS). Cualquiera verifica, solo el emisor firma. Es lo que usan los ecosistemas SMART.

Reglas de hierro:

1. **Base64url NO es cifrado**: cualquiera con el token lee header y payload. Jamás metas secretos ni datos clínicos en un JWT.
2. **NUNCA aceptes un JWT sin verificar la firma** contra la clave esperada, y valida también `iss`, `aud` y `exp`. Ataques históricos reales: tokens con `alg: none`, o forzar a una librería a verificar un token RS256 como HS256 usando la clave pública como secreto HMAC. Fija los algoritmos aceptados en tu configuración.
3. La confidencialidad en tránsito la da **TLS**, no el JWT.

### OpenID Connect: la identidad

OIDC añade sobre OAuth el **id_token**: un JWT cuyo propósito NO es acceder a recursos, sino afirmar "este usuario se autenticó, es tal, a tal hora". Se pide con el scope `openid` (y en SMART, `fhirUser` para obtener la URL del recurso FHIR del usuario: `Practitioner/456` o `Patient/123`). Distinción de examen: **access token = llave para la API; id_token = constancia de identidad**. No uses el id_token para llamar al servidor FHIR ni el access token como prueba de identidad.

## SMART on FHIR: App Launch y scopes

**SMART App Launch** es el perfil de OAuth 2.0/OIDC para salud: estandariza descubrimiento, lanzamiento, contexto y scopes para que la misma app corra en Epic, Cerner o tu HAPI nacional sin reescribirse. La versión vigente es la 2.2.

### Descubrimiento y lanzamiento

- La app descubre los endpoints en `[base]/.well-known/smart-configuration` (JSON con `authorization_endpoint`, `token_endpoint`, `capabilities`...).
- **EHR launch**: el usuario está DENTRO del EHR (abre la app desde el expediente de María). El EHR llama a la app con `iss` (el servidor FHIR) y un `launch` opaco; la app incluye `launch` y el scope `launch` en la autorización, y al canjear el token recibe el **contexto**: `patient` (id del paciente en pantalla), `encounter`, etc.
- **Standalone launch**: la app arranca por su cuenta (app de paciente en el teléfono). No hay `launch`; el contexto se solicita con scopes `launch/patient` o `launch/encounter` y el servidor lo resuelve (p. ej. preguntando al usuario).
- **fhirContext** (SMART 2.1+): mecanismo generalizado para pasar más contexto que paciente/encuentro (p. ej. una `List` o un `DiagnosticReport` concretos).

### Scopes v1 vs v2 en detalle

Gramática: `contexto/Recurso.permisos`, con `*` como comodín de recurso.

| Aspecto | v1 (SMART 1.0) | v2 (SMART 2.x, vigente) |
|---------|----------------|--------------------------|
| Verbos | `.read`, `.write`, `.*` | granulares `.c .r .u .d .s` (create, read, update, delete, search), combinables en ese orden |
| Leer y buscar | `.read` (ambiguo: incluía search) | `.r` y `.s` separados: `patient/Observation.rs` |
| Escribir | `.write` (create+update+delete, todo o nada) | `.c`, `.u`, `.d` independientes: `user/ServiceRequest.cu` |
| Filtros finos | no existen | parámetros embebidos: `patient/Observation.rs?category=vital-signs` |
| Ejemplos | `patient/Observation.read`, `user/*.write` | `patient/Observation.rs`, `system/Patient.rs`, `user/Condition.cruds` |

Contextos (iguales en v1 y v2):

- `patient/` — datos del paciente en contexto de la sesión.
- `user/` — lo que el usuario autenticado puede ver (multi-paciente si su rol lo permite).
- `system/` — sin usuario; procesos de sistema (Backend Services).

Scopes de identidad y contexto: `openid`, `fhirUser`, `launch`, `launch/patient`, `offline_access`. Principio rector: **mínimo privilegio**: pide el scope más pequeño que resuelva tu caso; `system/*.*` "por si acaso" es bandera roja de auditoría.

Importante: el scope es el **techo** del permiso, no el piso: el servidor puede conceder menos de lo pedido (la respuesta del token trae el `scope` efectivamente otorgado: léelo) y las políticas locales pueden restringir más.

### Backend Services: sistema a sistema

Para procesos sin usuario (exportes nocturnos, integración entre instituciones, Bulk Data):

1. El cliente se **registra** con el servidor de autorización aportando su **JWKS** (sus claves públicas), idealmente como `jwks_uri` para poder rotar claves.
2. Al pedir token, el cliente construye una **client assertion**: un JWT firmado con su clave privada, con `iss` = `sub` = su client_id, `aud` = la URL del token endpoint, `exp` corto (máx. 5 minutos) y `jti` único.
3. `POST` al token endpoint: `grant_type=client_credentials`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion=<jwt>`, `scope=system/...`.
4. El servidor verifica la firma contra el JWKS registrado y emite el access token (scopes `system/`). No hay refresh token: cuando expira, se firma otra assertion.

Fortaleza del esquema: **ningún secreto compartido viaja ni se almacena en el servidor de autorización**: solo claves públicas. La clave privada nunca sale del cliente.

## TLS, amenazas y auditoría

### TLS siempre

Todo tráfico FHIR va sobre **HTTPS/TLS** (1.2 mínimo, preferible 1.3), también "dentro" de la red institucional: la red interna no es zona de confianza. Los tokens viajan legibles para quien vea el tráfico; TLS es lo único que lo impide.

### Mapa de amenazas típicas

- **Token leakage**: tokens en URLs (quedan en logs y en el historial), en logs de aplicación, en localStorage expuesto a XSS. Mitigación: Bearer header siempre, redacción de logs, vida corta de tokens, revocación.
- **redirect_uri abierto**: si el servidor de autorización acepta redirecciones no registradas exactamente, un atacante recibe el `code` en su dominio. Mitigación: registro exacto (sin comodines) + PKCE.
- **CSRF en el callback**: inyectar un `code` ajeno en la sesión de la víctima. Mitigación: `state` verificado.
- **Phishing de consentimiento**: apps maliciosas con nombre y logo creíbles que piden scopes amplios y el usuario acepta sin leer. Mitigación: proceso de registro/verificación de apps, pantallas de consentimiento claras, scopes granulares (v2 ayuda: es más difícil justificar `system/*.*` que `patient/Observation.rs?category=vital-signs`).
- **Validación perezosa de JWT**: aceptar `alg: none`, no fijar algoritmos, no validar `aud` (un token emitido para otro servicio funciona en el tuyo). Mitigación: librerías maduras + configuración estricta + tests negativos.
- **Replay de assertions**: reusar una client assertion capturada. Mitigación: `exp` corto, `jti` único registrado, TLS.

### Auditoría y privacidad

- **AuditEvent**: registra quién accedió a qué, cuándo, desde dónde y con qué resultado. En una plataforma nacional, cada lectura de datos clínicos debería generar uno (los pacientes tienen derecho a saber quién miró su expediente).
- **Provenance**: documenta el origen de un recurso (quién lo creó/transformó, a partir de qué). Clave cuando los datos fluyen entre instituciones.
- **Datos ficticios en formación**: los servidores públicos (hapi.fhir.org, sandboxes) son compartidos y visibles. JAMÁS subas datos reales de pacientes a entornos de prueba. En demos y capacitaciones, usa generadores sintéticos (Synthea) o datos inventados. Esta regla no tiene excepciones.

## Errores comunes y gotchas

- **"OAuth me autentica."** OAuth **autoriza**; la autenticación del usuario para la app la aporta OpenID Connect (id_token). En el examen, "framework de autorización delegada" = OAuth 2.0.
- **Confundir 401 con 403**: 401 = token ausente/inválido/expirado (no autenticado); 403 = token válido pero permiso insuficiente. Ante un 401, renueva token; ante un 403, revisa scopes.
- **Creer que el JWT está cifrado**: base64url es codificación; el payload lo lee cualquiera. La firma da integridad y origen, no confidencialidad.
- **Usar el id_token para llamar a la API** (o el access token como prueba de identidad): cada token tiene su propósito.
- **Scope v1 y v2 mezclados**: `patient/Observation.read` es v1; `patient/Observation.rs` es v2. Reconoce ambos; escribe en v2.
- **Asumir que scope concedido = scope pedido**: el servidor puede recortar; lee el `scope` de la respuesta del token.
- **App Launch para un batch nocturno**: sin usuario presente, el flujo correcto es Backend Services (client_credentials + JWT assertion), no authorization code.
- **redirect_uri con comodines** o `state` sin verificar: las dos puertas clásicas de ataque al flujo.
- **Tokens en la URL** (`?access_token=...`): prohibido; header `Authorization: Bearer` siempre.
- **`system/*.*` "por si acaso"**: viola mínimo privilegio; en salud es hallazgo de auditoría automático.

## Nivel experto

- **PKCE también para clientes confidenciales**: aunque nació para clientes públicos (móvil/SPA que no guardan secreto), SMART 2.x lo exige en general: defensa en profundidad contra intercepción del code incluso donde hay client secret.
- **Rotación de claves con JWKS**: publicar el JWKS por `jwks_uri` (en vez de subir claves estáticas) permite rotar claves sin coordinación manual: publicas la nueva con otro `kid`, migras la firma, retiras la vieja. En una plataforma nacional con decenas de clientes Backend Services, la rotación NO negociada es la diferencia entre un incidente contenido y uno sistémico.
- **Revocación y vida de tokens**: los access tokens cortos (5-15 min en sistemas sensibles) acotan el daño de una fuga; los refresh tokens exigen almacenamiento cifrado y revocación server-side (endpoint de revocación, lista de sesiones). Diseña asumiendo que algún token se filtrará.
- **El servidor FHIR como policy enforcement point**: los scopes SMART son gruesos incluso en v2: "las observaciones del paciente X" no distingue salud mental ni VIH, que en muchas legislaciones tienen protección reforzada. El filtrado fino (por `meta.security`, etiquetas de confidencialidad, consentimiento vía recurso `Consent`) se implementa en el servidor o en un gateway; los scopes son la primera capa, no la última.
- **Contexto ≠ autorización**: el `patient` del launch context dice QUÉ paciente está en pantalla; el scope dice QUÉ puedes hacer. Un bug clásico de apps SMART es usar el contexto como si autorizara: consultar otro paciente cambiando el id en la URL debe fallar por scope (`patient/`), no por confianza en que la app "se porta bien".
- **Auditoría como producto, no como log**: AuditEvent consultable por API permite construir el "quién vio mi expediente" para el paciente y la detección de patrones anómalos (un usuario consultando 500 pacientes/hora). Si diriges la plataforma, presupuesta la auditoría como funcionalidad de primera clase desde el día uno; retro-instalarla es carísimo.
- **Sandboxes para practicar sin riesgo**: `launch.smarthealthit.org` simula un EHR completo (lanzamientos, contexto, tokens) sin instalar nada: ahí puedes ver cada paso del diagrama de este tema con tokens reales de mentira.

## Chuleta

| Término | Clave |
|---------|-------|
| Authn / Authz | Quién eres / qué puedes hacer -> 401 / 403 |
| OAuth 2.0 | Marco de autorización delegada; emite access tokens |
| Roles | Resource owner, client, authorization server, resource server (= servidor FHIR) |
| Authorization code + PKCE | Flujo con usuario: state (anti-CSRF), code_challenge/verifier (anti-intercepción), redirect_uri exacto |
| Access / refresh / id_token | Llave de API (corta) / renovación (larga, `offline_access`) / constancia de identidad (OIDC, scope `openid`) |
| JWT | header.payload.signature en base64url; claims iss, sub, aud, exp, jti; base64url ≠ cifrado |
| RS256 vs HS256 | Asimétrica (privada firma, pública verifica, JWKS) vs simétrica (secreto compartido); fija los algoritmos aceptados |
| Descubrimiento SMART | `[base]/.well-known/smart-configuration` |
| EHR launch / standalone | Con `launch` + `iss` desde el EHR / scopes `launch/patient` por cuenta propia; fhirContext para contexto extra |
| Scopes v2 | `contexto/Recurso.cruds` + parámetros: `patient/Observation.rs?category=vital-signs` |
| Contextos | `patient/` · `user/` · `system/` |
| Backend Services | client_credentials + client assertion JWT (iss=sub=client_id, aud=token endpoint, exp≤5min, jti) verificada contra JWKS; scopes system/ |
| Amenazas top | token leakage, redirect_uri abierto, CSRF sin state, phishing de consentimiento, validación perezosa de JWT |
| Auditoría | AuditEvent (quién accedió a qué) + Provenance (origen del dato) |
| Reglas de oro | TLS siempre; Bearer header, nunca URL; mínimo privilegio; datos ficticios en formación |

## Autoevaluacion

1. Explica authn vs authz con los códigos HTTP correspondientes y qué acción tomarías ante cada fallo.
2. Narra el flujo authorization code + PKCE en 6-8 pasos, indicando qué protege `state` y qué protege `code_verifier`.
3. ¿Qué diferencia a RS256 de HS256 y por qué los ecosistemas SMART usan firmas asimétricas con JWKS?
4. ¿Qué claims validarías SIEMPRE antes de aceptar un JWT y qué ataques evita cada validación?
5. Diferencia access token, refresh token e id_token: propósito, vida y scope que los solicita.
6. Escribe el scope v2 mínimo para: app de médico que crea y actualiza solicitudes de servicio; y compáralo con su equivalente v1.
7. Describe Backend Services completo: registro, client assertion (claims exactos), petición de token y por qué no hay secreto compartido.
8. Nombra tres amenazas del flujo OAuth y la mitigación concreta de cada una.

### Respuestas

1. Authn = demostrar identidad -> si falla, 401 (token ausente/inválido/expirado): renovar u obtener token. Authz = permisos -> si falla, 403 (scope insuficiente): revisar scopes/política, no reintentar con el mismo token.
2. (1) La app redirige al authorization server con client_id, redirect_uri, scope, state y code_challenge (S256); (2) el usuario se autentica y consiente; (3) redirect al redirect_uri registrado con code + state; (4) la app verifica state (anti-CSRF); (5) canjea code + code_verifier en el token endpoint (PKCE: quien robó solo el code no puede canjearlo); (6) recibe access_token (+ refresh_token, id_token); (7) llama al FHIR con Authorization: Bearer; (8) renueva con refresh token al expirar.
3. HS256 es HMAC simétrico: la misma clave firma y verifica, así que todo verificador puede falsificar. RS256 es asimétrico: solo el emisor firma (privada) y cualquiera verifica (pública, publicada por JWKS con kid). Permite ecosistemas abiertos multi-cliente con rotación de claves sin compartir secretos.
4. Firma contra la clave esperada con algoritmos fijados (evita alg:none y confusión RS256/HS256), iss (evita tokens de emisores ajenos), aud (evita reutilizar en tu API un token emitido para otro servicio), exp (evita tokens vencidos/replay prolongado); jti si aplica anti-replay.
5. Access token: llave temporal para la API (minutos), viaja en Bearer. Refresh token: credencial de larga vida para renovar access tokens sin usuario; se pide con offline_access y se guarda cifrado. id_token: JWT de OpenID Connect (scope openid) que atestigua la autenticación; no sirve para llamar a la API.
6. v2: `user/ServiceRequest.cu` (create + update, contexto user porque el médico maneja varios pacientes). v1 solo ofrecía `user/ServiceRequest.write`, que además regalaba delete: v2 permite mínimo privilegio real.
7. Registro: el cliente aporta su JWKS (idealmente jwks_uri). Token: POST con grant_type=client_credentials, client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer y client_assertion = JWT firmado con la privada, claims iss=sub=client_id, aud=URL del token endpoint, exp≤5 min, jti único. El servidor verifica contra el JWKS y emite token con scopes system/. Solo circulan claves públicas; la privada nunca sale del cliente.
8. Token leakage -> Bearer header (nunca URL), logs redactados, tokens cortos y revocables. redirect_uri abierto -> registro exacto sin comodines + PKCE. CSRF en el callback -> state aleatorio verificado. (También válidas: phishing de consentimiento -> verificación de apps y scopes granulares; validación perezosa -> librerías maduras con algoritmos fijados.)

## Para profundizar

- [SMART App Launch (especificación)](http://hl7.org/fhir/smart-app-launch/) — la fuente de verdad: flujos EHR/standalone, scopes v2, Backend Services, smart-configuration.
- [OAuth 2.0 (oauth.net)](https://oauth.net/2/) — el índice canónico del framework: grants, PKCE, mejores prácticas de seguridad actualizadas.
- [JWT.io](https://jwt.io) — decodificador interactivo y catálogo de librerías: pega un token de ejemplo y disecciona header/payload/firma.
- [SMART App Launcher (sandbox)](https://launch.smarthealthit.org) — simula lanzamientos EHR y standalone con tokens reales de práctica; el laboratorio perfecto de este tema.
- [Seguridad en FHIR R4](http://hl7.org/fhir/R4/security.html) — el marco oficial: TLS, etiquetas de seguridad, AuditEvent/Provenance y su relación con OAuth.
- [AuditEvent R4](http://hl7.org/fhir/R4/auditevent.html) — el recurso de auditoría que tu plataforma nacional debería emitir en cada acceso.
- [HTTP en MDN: Authorization](https://developer.mozilla.org/es/docs/Web/HTTP) — el sustrato HTTP de los esquemas Bearer y los códigos 401/403.
