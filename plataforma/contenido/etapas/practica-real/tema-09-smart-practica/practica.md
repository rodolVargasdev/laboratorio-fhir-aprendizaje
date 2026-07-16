# Practica

## Objetivo

Ejecutar los dos flujos SMART completos contra sandboxes públicos: simular un App Launch con contexto de paciente en launch.smarthealthit.org, y programar en Python el flujo Backend Services + Bulk Data contra bulk-data.smarthealthit.org (client assertion RS384, token, `$export`, polling y descarga NDJSON). Todo a costo $0 y sin datos reales.

## Preparacion

- Python 3.10+ con dependencias: `pip install pyjwt cryptography requests` (ver [Setup](/setup)).
- Navegador para los sandboxes. No se necesita cuenta ni tarjeta: ambos sandboxes son públicos y efímeros.
- En https://bulk-data.smarthealthit.org/ abre la pestaña de registro de cliente: elige **JWKS generado por el sandbox** (te da el par de claves y el `client_id`). Guarda en tu carpeta de trabajo: `privada.pem` (o el JWK privado JSON) y el `client_id` (es un token largo).
- Anota del sandbox la **FHIR base URL** y el **token endpoint** que muestra la pantalla (los usarás como variables del script).
- Verificación rápida del entorno: `python -c "import jwt, requests, cryptography; print('dependencias OK')"` debe imprimir `dependencias OK` sin errores.

## Ejercicios guiados

1. **Descubrimiento SMART.**

   ```bash
   curl -s https://bulk-data.smarthealthit.org/fhir/.well-known/smart-configuration
   ```

   Salida esperada: JSON con `token_endpoint`, `token_endpoint_auth_methods_supported: ["private_key_jwt"]` y `token_endpoint_auth_signing_alg_values_supported` incluyendo `RS384`. Verifica que el `token_endpoint` coincide con el que anotaste: será el `aud` de tu assertion.

2. **App Launch simulado en el navegador.** En https://launch.smarthealthit.org elige *Provider EHR Launch*, selecciona un paciente de prueba y lanza la app de ejemplo. Observa en la barra de direcciones la petición a `/authorize` (identifica `response_type`, `client_id`, `redirect_uri`, `scope`, `state`, `aud`) y, tras el consentimiento, el retorno con `code` y `state`. Criterio: capturas y explicas los 6 parámetros y el `patient` que llega con el token (visible en el panel de la app).

3. **Backend Services en Python: token con client assertion RS384.** Crea `bulk.py`:

   ```python
   import json, time, uuid, requests, jwt  # pip install pyjwt cryptography

   TOKEN_URL = "https://bulk-data.smarthealthit.org/auth/token"
   FHIR_BASE = "TU_FHIR_BASE_DEL_SANDBOX"
   CLIENT_ID = "TU_CLIENT_ID"
   PRIVATE_KEY = open("privada.pem").read()

   def obtener_token():
       assertion = jwt.encode(
           {"iss": CLIENT_ID, "sub": CLIENT_ID, "aud": TOKEN_URL,
            "exp": int(time.time()) + 300, "jti": str(uuid.uuid4())},
           PRIVATE_KEY, algorithm="RS384",
           headers={"kid": "TU_KID"})
       r = requests.post(TOKEN_URL, data={
           "grant_type": "client_credentials",
           "scope": "system/Patient.rs system/Observation.rs",
           "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
           "client_assertion": assertion})
       r.raise_for_status()
       return r.json()["access_token"]

   print(obtener_token()[:40], "...")
   ```

   Salida esperada: los primeros caracteres de un JWT (`eyJ...`). Si recibes `invalid_client`, revisa `aud` y `kid`; si `invalid_scope`, ajusta a los scopes que registraste.

4. **Kick-off del export y polling.** Añade a `bulk.py`:

   ```python
   def exportar():
       tok = obtener_token()
       h = {"Authorization": f"Bearer {tok}", "Accept": "application/fhir+json",
            "Prefer": "respond-async"}
       r = requests.get(f"{FHIR_BASE}/Patient/$export?_type=Patient,Observation", headers=h)
       assert r.status_code == 202, r.text
       estado = r.headers["Content-Location"]
       while True:
           s = requests.get(estado, headers={"Authorization": f"Bearer {obtener_token()}"})
           if s.status_code == 200:
               return s.json()
           espera = int(s.headers.get("Retry-After", "5"))
           print("En progreso:", s.headers.get("X-Progress", "?"), f"(espero {espera}s)")
           time.sleep(espera)

   manifiesto = exportar()
   print(json.dumps([o["type"] for o in manifiesto["output"]], indent=2))
   ```

   Salida esperada: líneas `En progreso: ...` y al final la lista `["Patient", "Observation"]`. Verifica que `manifiesto["error"]` está vacío.

5. **Descarga y conteo de NDJSON.**

   ```python
   tok = obtener_token()
   for salida in manifiesto["output"]:
       r = requests.get(salida["url"], headers={
           "Authorization": f"Bearer {tok}", "Accept": "application/fhir+ndjson"})
       lineas = [l for l in r.text.splitlines() if l.strip()]
       primero = json.loads(lineas[0])
       print(salida["type"], len(lineas), "recursos; primero:", primero["resourceType"], primero["id"])
   ```

   Salida esperada: conteos coherentes con los `count` del manifiesto y `resourceType` correcto en la primera línea de cada archivo. Con esto acabas de construir, en miniatura, el reporte epidemiológico nocturno de la red nacional.

## Limpieza

Los sandboxes de SMART Health IT son públicos, efímeros y no facturan: no hay nada que borrar en la nube. Higiene local: elimina `privada.pem` y cualquier JWK privado de tu carpeta al terminar (`rm privada.pem`) y nunca los subas a git (revisa `.gitignore`).

## Retos

1. **Anatomía del assertion**: decodifica tu client assertion en jwt.io (solo la parte pública) y documenta header y claims. Éxito: explicas cada campo y por qué `exp` corto importa.
2. **Romperlo a propósito**: provoca y documenta tres errores reales — `aud` con la base FHIR, `exp` de 1 hora, algoritmo RS256. Éxito: capturas los tres mensajes de error del sandbox y su causa.
3. **Cohorte con Group**: repite el export usando `Group/[id]/$export` con un grupo del sandbox. Éxito: el manifiesto solo contiene recursos de la cohorte.
4. **Incremental con `_since`**: exporta con `_since` de ayer y compara conteos contra el export completo. Éxito: explicas cuándo usar exports incrementales en producción.
5. **Scope mínimo**: reduce el scope a `system/Patient.rs` y demuestra qué deja de funcionar. Éxito: el export de Observation falla o se omite, y lo explicas con el `scope` concedido.
6. **Cancelación**: lanza un export y cancélalo con `DELETE` a la URL de estado. Éxito: recibes el código esperado y el polling posterior confirma la cancelación.

## Reto Feynman

Explícale a la dirección de la institución, en menos de un minuto y sin jerga: por qué el "usuario y contraseña compartidos entre sistemas" que hoy usan las integraciones debe morir, y cómo Backend Services (llave privada que nunca viaja + permisos `system/` de mínimo privilegio + tokens de 5 minutos) reduce el riesgo de una filtración nacional.

## Criterio de completado

- [ ] smart-configuration del sandbox leído e interpretado (token endpoint, algoritmos, capabilities).
- [ ] App Launch simulado con los 6 parámetros del authorize identificados y el contexto `patient` observado.
- [ ] Token de Backend Services obtenido desde Python con assertion RS384 propio.
- [ ] Export completo: kick-off 202, polling respetando Retry-After, manifiesto con `error` vacío.
- [ ] NDJSON descargados y contados; conteos coinciden con el manifiesto.
- [ ] Al menos 4 retos completados, incluido "Romperlo a propósito".
- [ ] Claves privadas eliminadas del disco y ausentes del repositorio.
