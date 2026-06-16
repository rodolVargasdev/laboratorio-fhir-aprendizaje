# Dia 17: SMART on FHIR en practica (App Launch y Backend Services)

Objetivo: pasar de la teoria OAuth (dia 6) a un flujo SMART concreto: descubrir
endpoints de autorizacion, scopes y el flujo Backend Services (JWT firmado).
Clave para Advanced Developer (seguridad ~20%).
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 17`

## Teoria

### Dos perfiles SMART que debes conocer

1. **SMART App Launch** (usuario presente): la app se lanza desde un portal/EHR;
   el usuario autoriza; la app recibe un token con scopes limitados al paciente
   o al usuario (ej. `patient/Observation.read`).

2. **SMART Backend Services** (sistema a sistema, sin usuario): tu backend se
   autentica con un JWT firmado (RS384/ES384); el servidor de autorizacion
   devuelve un access token; usas ese token en las peticiones FHIR.

### Flujo Backend Services (paso a paso)

1. Tu sistema tiene un par de claves (privada secreta, publica en JWKS).
2. Construyes un JWT con claims: `iss`, `sub`, `aud` (token URL), `exp`, `jti`.
3. POST al endpoint de token con `grant_type=client_credentials` y el JWT como
   `client_assertion`.
4. Recibes `access_token` (y opcionalmente `scope`).
5. Llamas a FHIR con `Authorization: Bearer <token>`.

### Scopes granulares (US Core)

Formato: `{context}/{ResourceType}.{permission}`

Ejemplos:
- `patient/Patient.read` — leer datos del paciente en contexto
- `system/Patient.read` — leer pacientes a nivel de sistema
- `patient/Observation.rs` — read + search de observaciones

Principio de **menor privilegio**: pide solo los scopes que necesitas.

### Donde encontrar la config SMART de un servidor

Muchos servidores publican:
- En **CapabilityStatement**: extensiones de seguridad OAuth
- **`.well-known/smart-configuration`**: URLs de authorize, token, capabilities

## Practica

```powershell
python dias\dia-17\practica\smart_explorar.py
```

El script:
1. Lee el CapabilityStatement del servidor y busca info de seguridad OAuth.
2. Construye un JWT de ejemplo para Backend Services y explica cada claim.
3. (Opcional) consulta la config SMART del sandbox publico de SMART Health IT.

Guia complementaria del sandbox (sin codigo obligatorio):
https://bulk-data.smarthealthit.org/

Reto: escribe en `PROGRESO.md` los scopes minimos que pedirias para una app de
DoctorSV que solo muestra signos vitales de un paciente.

## Reto Feynman

Explica la diferencia entre App Launch y Backend Services, y por que Backend
Services usa un JWT firmado en lugar de una contrasena.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 17. Tema: SMART on FHIR en practica (App Launch vs
Backend Services, scopes, JWT). Soy desarrollador intermedio en DoctorSV, en
espanol. Sin darme respuestas directas, guiame paso a paso por el flujo Backend
Services, los claims del JWT y como elegir scopes con menor privilegio. Errores
a vigilar: confundir authn con authz, pedir scopes de mas, olvidar exp/jti en el
JWT. Al final pideme explicar App Launch vs Backend Services (Feynman).
