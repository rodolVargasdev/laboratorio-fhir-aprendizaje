# Tema 9 · SMART on FHIR en práctica

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Distinguir con claridad SMART App Launch (usuario presente) de Backend Services (sistema a sistema).
- Recitar el flujo Backend Services completo: claves, JWT firmado, token, petición FHIR.
- Explicar cada claim del JWT de autenticación: `iss`, `sub`, `aud`, `exp`, `jti`.
- Leer y elegir scopes SMART granulares (`patient/`, `user/`, `system/`) con menor privilegio.
- Descubrir la configuración SMART de cualquier servidor vía `.well-known/smart-configuration`.

## Lectura

### El problema que resuelve SMART

FHIR define QUÉ datos se intercambian y CÓMO se consultan, pero no dice quién puede entrar ni con qué permisos. **SMART on FHIR** llena ese hueco: es un perfil de OAuth 2.0 estandarizado para salud, de modo que una misma app funcione contra cualquier EHR que lo implemente. Es la parte de seguridad (~20% del examen Advanced Developer) y el corazón de cualquier integración seria de DoctorSV con terceros.

### Dos perfiles, dos escenarios

**1. SMART App Launch** — hay un humano presente. La app se lanza desde un portal o desde el propio EHR; el usuario ve una pantalla de autorización y consiente; la app recibe un token acotado al contexto de ese usuario o de ese paciente (ej. `patient/Observation.read`). Analogía: el visitante de un hospital que se registra en recepción y recibe un gafete que solo abre la habitación que va a visitar.

**2. SMART Backend Services** — no hay nadie sentado frente a la pantalla. Tu backend (un job nocturno, un servicio de sincronización) se autentica solo, presentando un **JWT firmado** con su clave privada. Analogía: el proveedor de insumos con credencial corporativa verificable, que entra por el muelle de carga sin que nadie lo acompañe.

Error común: intentar usar App Launch para un proceso batch "simulando" un usuario. Si no hay humano, el perfil correcto es Backend Services.

### Backend Services paso a paso

1. **Par de claves**: tu sistema genera clave privada (secreta, nunca sale de tu servidor) y clave pública, que publicas en un **JWKS** (JSON Web Key Set), una URL con tus claves públicas. Al registrarte con el servidor de autorización le das esa URL.
2. **Construyes un JWT** firmado con la privada (algoritmos asimétricos **RS384 o ES384**) con estos claims:
  - `iss` (issuer): tu client_id — quién firma.
  - `sub` (subject): también tu client_id — de quién habla el token (en Backend Services, iss = sub).
  - `aud` (audience): la URL del endpoint de token — para quién es. Evita que un token robado se reutilice contra otro servidor.
  - `exp` (expiration): expiración corta (máx. 5 minutos). Limita la ventana de ataque.
  - `jti` (JWT ID): identificador único del token. Impide ataques de repetición (replay): el mismo JWT no se acepta dos veces.
3. **POST al endpoint de token** con `grant_type=client_credentials`, el JWT como `client_assertion`, y los scopes que pides.
4. El servidor verifica la firma contra tu JWKS y responde con un **`access_token`** (y opcionalmente los scopes concedidos, que pueden ser menos de los pedidos).
5. Llamas a FHIR con `Authorization: Bearer <access_token>`.

¿Por qué JWT firmado y no una contraseña? Una contraseña es un secreto compartido: viaja en cada petición y quien la intercepte la reutiliza. Con firma asimétrica la clave privada **nunca viaja**; el servidor solo verifica con la pública. Además `exp` y `jti` hacen que cada JWT sea de un solo uso y corta vida.

Errores comunes: olvidar `exp` o `jti` (el servidor rechaza el JWT), poner en `aud` la base FHIR en vez de la URL del token, y confundir autenticación (demostrar quién eres: el JWT) con autorización (qué puedes hacer: los scopes).

### Scopes granulares

Formato: `{contexto}/{TipoDeRecurso}.{permisos}`

- Contexto: `patient/` (limitado al paciente en contexto), `user/` (lo que el usuario puede ver) o `system/` (nivel sistema, sin usuario — el de Backend Services).
- Permisos en SMART v2: letras `c` (create), `r` (read), `u` (update), `d` (delete), `s` (search). Se combinan: `.rs` = leer y buscar.

Ejemplos:
- `patient/Observation.rs` — leer y buscar observaciones del paciente en contexto.
- `system/Observation.rs` — leer y buscar observaciones a nivel sistema.
- `patient/Patient.read` — estilo v1, aún común: leer al paciente en contexto.

**Menor privilegio**: pide solo lo que tu app usa. Una app de DoctorSV que solo muestra signos vitales de un paciente pide `patient/Observation.rs` (quizá más `patient/Patient.read` para el encabezado) — no `patient/*.read` ni nada `system/`.

### Descubrir la configuración de un servidor

Antes de integrar, pregunta al servidor qué soporta:

- **`.well-known/smart-configuration`**: documento JSON en la raíz FHIR con las URLs de `authorization_endpoint`, `token_endpoint` y capacidades SMART.
- **CapabilityStatement** (`GET /metadata`): en `rest.security` trae extensiones OAuth con las mismas URLs.

Para practicar sin riesgo existe el sandbox de SMART Health IT (launch.smarthealthit.org y bulk-data.smarthealthit.org), que te deja ejercitar el flujo completo con datos ficticios.

## Chuleta

| Concepto | Valor rápido |
|---|---|
| App Launch | usuario presente, autoriza en pantalla, scopes `patient/` o `user/` |
| Backend Services | sistema a sistema, JWT firmado, scopes `system/` |
| Algoritmos de firma | RS384 o ES384 (asimétricos) |
| `iss` / `sub` | tu client_id (iguales en Backend Services) |
| `aud` | URL del endpoint de token (no la base FHIR) |
| `exp` | expiración corta, máx. 5 min |
| `jti` | id único anti-replay |
| Petición de token | POST, `grant_type=client_credentials`, JWT en `client_assertion` |
| Uso del token | `Authorization: Bearer <access_token>` |
| Scope v2 | `{contexto}/{Recurso}.{cruds}` — ej. `system/Observation.rs` |
| Descubrimiento | `GET {base}/.well-known/smart-configuration` o CapabilityStatement |

## Autoevaluación (sin mirar arriba)

1. ¿Cuándo usas App Launch y cuándo Backend Services? Da un ejemplo de DoctorSV para cada uno.
2. Enumera los 5 claims obligatorios del JWT de Backend Services y explica en una frase el propósito de cada uno.
3. ¿Por qué Backend Services usa un JWT firmado con clave asimétrica en lugar de un client secret o contraseña?
4. Descompón el scope `system/Observation.rs`: ¿qué significa cada parte y en qué perfil SMART lo verías?
5. Te dan solo la URL base de un servidor FHIR. ¿Dónde buscas sus endpoints de authorize y token?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 9 SMART".
2. Añade estos enlaces oficiales como fuentes:
  - http://hl7.org/fhir/smart-app-launch/ — la especificación SMART App Launch, fuente primaria del tema.
  - https://bulk-data.smarthealthit.org/ — sandbox de Backend Services/Bulk Data para ver el flujo JWT real.
  - https://launch.smarthealthit.org — sandbox de App Launch para simular el lanzamiento desde un EHR.
  - http://hl7.org/fhir/R4/http.html — la API REST que consumes una vez que tienes el token.
3. Prompts sugeridos:
  - "Genera una tabla comparativa App Launch vs Backend Services: actor, flujo, tipo de credencial, scopes típicos y ejemplo de uso en una clínica."
  - "Simula que soy el servidor de autorización: te presento JWTs con defectos (sin exp, aud incorrecto, jti repetido) y explícame por qué rechazarías cada uno."
  - "Hazme 10 preguntas de examen sobre claims JWT y scopes SMART v2, corrigiéndome con la fuente."

---

### Respuestas

1. App Launch cuando hay usuario presente (ej. un médico de DoctorSV abre una app de gráficas desde el portal y autoriza ver a su paciente). Backend Services cuando es sistema a sistema sin usuario (ej. un job nocturno de DoctorSV que sincroniza observaciones con el servidor nacional).
2. `iss`: quién emite (tu client_id). `sub`: sobre quién habla (tu client_id, igual a iss). `aud`: URL del endpoint de token, para que el JWT no sirva contra otro servidor. `exp`: expiración corta que limita la ventana de uso. `jti`: id único que impide reusar (replay) el mismo JWT.
3. Porque la clave privada nunca viaja por la red: el servidor verifica la firma con la clave pública (JWKS). Un secreto compartido viaja en cada petición y quien lo capture lo reutiliza; el JWT además caduca en minutos y es de un solo uso por `jti`.
4. `system/` = contexto de sistema, sin usuario; `Observation` = tipo de recurso; `.rs` = read + search. Lo verías en Backend Services.
5. En `{base}/.well-known/smart-configuration` (JSON con authorization_endpoint, token_endpoint y capacidades) o en el CapabilityStatement (`GET /metadata`), dentro de `rest.security`.
