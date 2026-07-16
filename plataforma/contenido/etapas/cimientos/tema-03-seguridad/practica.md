# Practica

## Objetivo

Tocar cada pieza del stack de seguridad: descubrir la configuración SMART de un servidor, provocar y distinguir un 401 de un 403 conceptualmente, diseccionar un JWT real (de prueba) verificando por qué la firma importa, y simular un lanzamiento SMART completo en el sandbox oficial.

## En el navegador (Laboratorio)

Usa el playground (GET contra `https://hapi.fhir.org/baseR4`; escribe solo el path).

1. Consulta: `metadata?_summary=true`
   Qué observar: en `rest[0].security`, si el servidor declara mecanismos de seguridad (HAPI público es abierto: no exige token).
   Qué esperar: entender que un servidor FHIR DECLARA su seguridad en el CapabilityStatement; un servidor SMART listaría ahí el extension de OAuth con sus endpoints.

2. Consulta: `.well-known/smart-configuration`
   Qué observar: la respuesta (en HAPI público puede ser 404: no es un servidor SMART).
   Qué esperar: si existe, un JSON con `authorization_endpoint`, `token_endpoint` y `capabilities`; si es 404, acabas de aprender a distinguir un servidor FHIR abierto de uno protegido con SMART. Compara con el sandbox del ejercicio de PC.

3. Consulta: `AuditEvent?_count=3`
   Qué observar: si el servidor almacena eventos de auditoría: `agent` (quién), `entity` (sobre qué), `recorded` (cuándo).
   Qué esperar: la forma del recurso que tu plataforma nacional emitiría en cada acceso; si no hay instancias, revisa su definición en la spec.

4. Consulta: `Consent?_count=2`
   Qué observar: cómo se representa el consentimiento como recurso.
   Qué esperar: conectar la capa OAuth (scopes) con la capa de consentimiento fino que los scopes no cubren.

## En la PC

Con el entorno del [Setup](/setup).

Disecciona un JWT de PRUEBA (nunca uno real de producción). Copia este token de ejemplo a un archivo o variable:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZWplbXBsby5zdiIsInN1YiI6InVzdWFyaW8tMTIzIiwiYXVkIjoiaHR0cHM6Ly9maGlyLmVqZW1wbG8uc3YiLCJleHAiOjE3ODM3MjgwMDAsInNjb3BlIjoicGF0aWVudC9PYnNlcnZhdGlvbi5ycyJ9.FAKE_SIGNATURE_DO_NOT_TRUST
```

Decodifícalo con Python (solo las dos primeras partes):

```powershell
python -c "import base64, json; t = open('token.txt').read().strip().split('.'); pad = lambda s: s + '=' * (-len(s) % 4); [print(json.dumps(json.loads(base64.urlsafe_b64decode(pad(p))), indent=2)) for p in t[:2]]"
```

Salida esperada: el header (`alg: HS256`) y el payload con `iss`, `sub`, `aud`, `exp` y `scope: patient/Observation.rs`. Reflexiona: pudiste leerlo TODO sin ninguna clave: base64url no es cifrado. La tercera parte (firma) es falsa: un servidor conforme lo rechazaría al verificarla.

Sandbox SMART (sin instalar nada): abre `https://launch.smarthealthit.org` en el navegador:

1. Elige "Provider EHR Launch", selecciona un paciente y un profesional de práctica.
2. Usa la app de ejemplo del sandbox y observa la pantalla de autorización: qué scopes pide.
3. Tras el lanzamiento, inspecciona la respuesta del token (el sandbox la muestra): localiza `access_token`, `expires_in`, `scope` concedido y el contexto `patient`.
4. Repite como "Patient Standalone Launch" y nota la diferencia: no hay `launch`; el contexto sale de `launch/patient`.

## Retos

1. Del JWT de ejemplo, identifica qué claim impide usarlo (a) después de cierta fecha y (b) contra un servidor distinto del previsto. Éxito: `exp` y `aud`, con explicación.
2. Escribe los scopes v2 mínimos para tres casos: app de paciente que lee y busca sus vacunas (`Immunization`); app de médico que crea y actualiza recetas (`MedicationRequest`); job nocturno que lee y busca todos los `Encounter`. Éxito: `patient/Immunization.rs`, `user/MedicationRequest.cu`, `system/Encounter.rs`.
3. En el sandbox, fuerza un caso 403 conceptual: pide un scope de solo lectura y razona qué pasaría si la app intentara un POST. Éxito: explicas por qué es 403 y no 401.
4. Dibuja (texto o papel) el flujo Backend Services completo con los claims exactos de la client assertion. Éxito: iss=sub=client_id, aud=token endpoint, exp≤5 min, jti; grant_type y client_assertion_type correctos.
5. Lista las validaciones que tu servidor haría antes de aceptar un JWT entrante y qué ataque bloquea cada una. Éxito: firma+algoritmos fijados, iss, aud, exp, (jti) con su ataque correspondiente.
6. Redacta en 5 líneas la política de "datos en formación" para tu equipo. Éxito: prohíbe datos reales en sandboxes públicos y nombra una alternativa (datos sintéticos).

## Reto Feynman

Explica a un colega no técnico, en 4-6 líneas: (1) la tarjeta-llave de hotel como imagen del access token (abre solo tu cuarto, por pocos días, y la recepción nunca te dio la llave maestra ni tu contraseña viajó con la tarjeta), y (2) por qué el hospital puede dejar que una app externa vea TUS datos sin darle jamás tu contraseña.

## Criterio de completado

- [ ] Consulté smart-configuration y sé distinguir un servidor abierto de uno SMART.
- [ ] Decodifiqué el JWT de prueba y explico por qué leerlo no es romperlo (y por qué la firma sí manda).
- [ ] Completé un EHR launch y un standalone launch en el sandbox y localicé el contexto `patient`.
- [ ] Escribo scopes v2 de mínimo privilegio para paciente/usuario/sistema sin consultar la chuleta.
- [ ] Reproduzco el flujo Backend Services con los claims exactos de la assertion.
- [ ] Distingo 401 de 403 con un ejemplo propio y completé el Reto Feynman.
