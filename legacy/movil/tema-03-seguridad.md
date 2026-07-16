# Tema 3 · Seguridad: OAuth 2.0 y SMART on FHIR

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Distinguir autenticación (quién eres) de autorización (qué puedes hacer) sin dudar.
- Explicar el flujo OAuth 2.0: cliente, servidor de autorización, servidor de recursos, access token.
- Leer y escribir scopes SMART: `patient/Observation.read`, `user/*.read`, `system/Patient.read`.
- Diferenciar SMART App Launch (apps con usuario) de SMART Backend Services (sistema a sistema).
- Descomponer un JWT (header.payload.signature) y reconocer claims: iss, aud, exp, scope.
- Evitar errores clásicos: confundir 401 con 403, creer que el token "lleva tu contraseña".

## Lectura

### Dos preguntas distintas: ¿quién eres? y ¿qué puedes hacer?

- **Autenticación (authn)**: demostrar QUIÉN eres. Analogía: mostrar tu DUI o pasaporte en la entrada.
- **Autorización (authz)**: qué tienes PERMITIDO hacer. Analogía: tu boleto dice a qué zonas del concierto puedes entrar.

Puedes estar perfectamente autenticado (te sé el nombre) y no autorizado (no puedes entrar al backstage). En HTTP esto se refleja en dos códigos que el examen ama confundirte: **401 Unauthorized** = fallo de autenticación (no hay token o es inválido/expirado); **403 Forbidden** = autenticado pero sin permiso (tu scope no alcanza).

### OAuth 2.0: acceso limitado sin regalar tu contraseña

OAuth 2.0 es un marco de **AUTORIZACIÓN** (no de autenticación; para identidad existe OpenID Connect encima). Permite que una app obtenga acceso limitado a tus datos **sin conocer tu contraseña**, usando un **access token**: una credencial temporal.

Analogía: la tarjeta-llave de hotel. Abre TU cuarto, por unos días, y no es la llave maestra ni revela tu identidad al cerrajero. Si la pierdes, caduca sola o la anulan; tu "contraseña" (la recepción) nunca viajó con la tarjeta.

Las cuatro piezas del tablero:

1. **Resource owner**: el dueño de los datos (el paciente o la institución).
2. **Cliente**: la app que quiere acceso (tu app de la integración nacional).
3. **Servidor de autorización**: quien verifica y emite tokens.
4. **Servidor de recursos**: donde viven los datos — aquí, el servidor FHIR.

Flujo típico (authorization code, el que usa SMART): la app redirige al usuario al servidor de autorización → el usuario se autentica y aprueba los permisos → la app recibe un código y lo canjea por un **access token** → la app llama al servidor FHIR poniendo el token en la cabecera `Authorization: Bearer <token>`. El servidor FHIR valida el token y sirve solo lo que los **scopes** permitan.

### Scopes: el vocabulario del permiso

Un **scope** es el alcance del permiso, y SMART los estandariza con una gramática precisa:

```
contexto / RecursoFHIR . permiso
```

- **Contexto**: `patient/` (solo datos del paciente en contexto), `user/` (lo que el usuario logueado puede ver) o `system/` (acceso de sistema, sin usuario).
- **Recurso**: un tipo FHIR (`Observation`, `Patient`) o `*` para todos.
- **Permiso**: `.read`, `.write` o `.*` (en SMART v2 se afina a `.cruds`: create/read/update/delete/search).

Ejemplos: `patient/Observation.read` = leer las observaciones DEL paciente en contexto. `user/*.read` = leer todo lo que el usuario logueado tenga permitido. `system/Patient.read` = un backend lee pacientes sin usuario presente. Principio de mínimo privilegio: pide el scope más chico que resuelva tu caso.

### SMART on FHIR: OAuth con reglas de hospital

**SMART on FHIR** (Substitutable Medical Applications, Reusable Technologies) es un **perfil de OAuth 2.0 para salud**. No inventa seguridad nueva: estandariza cómo se aplica OAuth al mundo FHIR para que la misma app corra en Epic, Cerner o tu servidor HAPI sin reescribirse. Define:

- Cómo una app **descubre** los endpoints de autorización del servidor (vía `.well-known/smart-configuration` o el CapabilityStatement).
- La gramática de **scopes** que ya viste.
- El **contexto de lanzamiento**: si el médico abre la app desde el expediente de María, la app recibe automáticamente QUÉ paciente está en pantalla (launch context), sin preguntarlo.

Dos modalidades que debes distinguir:

- **SMART App Launch**: apps con usuario presente (médico o paciente), lanzadas desde un portal/EHR o standalone. Usa el flujo authorization code con redirección en navegador.
- **SMART Backend Services**: sistema-a-sistema, **sin usuario** (p. ej. un job nocturno que exporta datos). No hay pantalla de login: el cliente se autentica firmando un **JWT con su clave privada** (el servidor verifica con la pública registrada, vía JWKS) y recibe un token con scopes `system/...`.

### JWT: el token que puedes leer (pero no falsificar)

Muchos access tokens son **JWT** (JSON Web Token): un texto con tres partes separadas por puntos:

```
header.payload.signature
```

- **Header**: JSON en base64url; dice el algoritmo de firma (p. ej. RS256).
- **Payload**: JSON en base64url con los **claims**: `iss` (quién lo emitió), `aud` (para quién es), `sub` (sujeto), `exp` (cuándo expira, timestamp Unix), `scope` (permisos).
- **Signature**: la firma criptográfica.

Punto crítico: base64url **NO es cifrado**, es solo codificación. Cualquiera que tenga el token puede LEER header y payload (por eso jamás metas secretos en un JWT). Lo que la firma garantiza es **integridad y origen**: si alguien altera el payload, la firma deja de cuadrar y el servidor lo rechaza. Y como el token viaja legible, todo va sobre **HTTPS/TLS** siempre — en salud, sin excepción.

Ciclo de vida: los access tokens son de vida corta (minutos a una hora, mira `exp`). Cuando expira, recibes 401 y usas un **refresh token** (si te lo dieron) para pedir otro sin molestar al usuario.

### Errores comunes

- Decir "OAuth me autentica": OAuth **autoriza**; la autenticación de identidad la aporta OpenID Connect u otro mecanismo.
- Confundir 401 (token ausente/inválido/expirado) con 403 (token válido pero scope insuficiente).
- Creer que el token contiene o revela la contraseña del usuario: nunca viaja.
- Pensar que el JWT está cifrado porque "se ve raro": es base64url, legible por cualquiera.
- Pedir `system/*.*` "por si acaso": viola el mínimo privilegio y en auditorías de salud es bandera roja.
- Usar App Launch para un batch nocturno sin usuario: eso es Backend Services.

## Chuleta

| Término | Clave |
|---------|-------|
| Authn | Quién eres (DUI) → falla = 401 |
| Authz | Qué puedes hacer (boleto) → falla = 403 |
| OAuth 2.0 | Marco de autorización; emite access tokens |
| Access token | Credencial temporal; va en `Authorization: Bearer <token>` |
| Scope SMART | `contexto/Recurso.permiso` → `patient/Observation.read` |
| Contextos | `patient/` · `user/` · `system/` |
| SMART App Launch | Con usuario; redirección; contexto de paciente |
| Backend Services | Sin usuario; JWT firmado con clave privada; scopes system/ |
| JWT | `header.payload.signature`; base64url ≠ cifrado |
| Claims | `iss` emisor · `aud` audiencia · `exp` expiración · `scope` |
| Descubrimiento | `.well-known/smart-configuration` |
| Regla de oro | Mínimo privilegio + siempre HTTPS |

## Autoevaluación (sin mirar arriba)

1. Explica authn vs authz con una analogía y di qué código HTTP corresponde a cada fallo.
2. ¿Qué cuatro actores participan en OAuth 2.0 y cuál de ellos es el servidor FHIR?
3. Descompón el scope `patient/Observation.read`: ¿qué significa cada parte?
4. ¿Cuándo usarías SMART Backend Services en vez de App Launch, y cómo se autentica el cliente ahí?
5. ¿Por qué cualquiera puede leer el payload de un JWT y aun así el token es seguro?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 3 Seguridad".
2. Añade estos enlaces oficiales como fuentes:
  - http://hl7.org/fhir/smart-app-launch/ — la especificación SMART App Launch: flujos, scopes, contexto.
  - https://launch.smarthealthit.org — sandbox oficial para simular lanzamientos SMART sin instalar nada.
  - https://bulk-data.smarthealthit.org/ — sandbox de Backend Services: JWKS, JWT firmado, scopes system/.
  - http://hl7.org/fhir/R4/http.html — la API REST que estos tokens protegen (contexto de 401/403).
3. Prompts sugeridos:
  - "Hazme un examen oral: descríbeme situaciones (app de paciente, job nocturno, médico en el EHR) y yo debo decir qué flujo SMART y qué scope exacto usar."
  - "Compara en una tabla SMART App Launch vs SMART Backend Services: quién participa, cómo se autentica el cliente, qué scopes usa y un caso de uso de cada uno."
  - "Dame 6 afirmaciones sobre OAuth/JWT donde algunas contengan errores conceptuales típicos (401 vs 403, base64 vs cifrado, OAuth = autenticación) y pídeme detectarlos y corregirlos."

---

### Respuestas

1. Authn = demostrar quién eres (mostrar el DUI) → si falla, 401. Authz = qué tienes permitido (el boleto dice a qué zonas entras) → si falla, 403.
2. Resource owner (dueño de los datos), cliente (la app), servidor de autorización (emite tokens) y servidor de recursos: este último es el servidor FHIR.
3. `patient/` = contexto limitado al paciente en sesión; `Observation` = tipo de recurso FHIR alcanzado; `.read` = solo lectura (nada de crear/modificar).
4. Cuando no hay usuario presente (integración sistema-a-sistema, exportes batch): el cliente se autentica firmando un JWT con su clave privada, el servidor lo verifica con la clave pública (JWKS) y emite un token con scopes system/.
5. Porque header y payload son solo base64url (codificación, no cifrado), pero la firma criptográfica garantiza que nadie lo alteró y que lo emitió el servidor legítimo; la confidencialidad en tránsito la da HTTPS.
