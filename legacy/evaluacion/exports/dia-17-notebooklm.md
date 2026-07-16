# Dia 17 — SMART on FHIR practica

> Material de estudio para **NotebookLM**. Laboratorio FHIR Aprendizaje.
> Generado: 2026-06-15

## Como usar este documento en NotebookLM

1. Ve a [notebooklm.google.com](https://notebooklm.google.com) y crea un cuaderno nuevo.
2. Sube este archivo `.md` (o copia todo el texto como fuente pegada).
3. Opcional: anade 1-2 fuentes oficiales (enlace HL7 o GCP del dia). Maximo ~50 fuentes por cuaderno.
4. Usa los prompts sugeridos al final o genera un **Audio Overview**.
5. **No subas** credenciales, tokens ni `historial.csv` personal.

## Certificaciones relacionadas

- **advanced** — Seguridad y SMART on FHIR (App Launch + Backend Services)
- **advanced** — Conformidad y CapabilityStatement

---

## Leccion

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
la integración nacional que solo muestra signos vitales de un paciente.

## Reto Feynman

Explica la diferencia entre App Launch y Backend Services, y por que Backend
Services usa un JWT firmado en lugar de una contrasena.


---

## Practica (codigo y guias)

### Archivo: `practica\smart_explorar.py`
```python
r"""Dia 17 - Practica: explorar seguridad OAuth/SMART y armar un JWT Backend Services.

No requiere registrar una app real. Construye un JWT de ejemplo y lee metadata.
Ejecuta:
    python dias\dia-17\practica\smart_explorar.py
"""

import base64
import json
import os
import time
import uuid

import requests

BASE_URL = os.environ.get("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4")
SMART_WELL_KNOWN = "https://bulk-data.smarthealthit.org/.well-known/smart-configuration"


def b64url(datos: dict) -> str:
    crudo = json.dumps(datos, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(crudo).rstrip(b"=").decode("ascii")


def leer_capability() -> None:
    print("=== CapabilityStatement / metadata ===")
    resp = requests.get(f"{BASE_URL}/metadata", headers={"Accept": "application/fhir+json"}, timeout=60)
    resp.raise_for_status()
    cap = resp.json()
    rest = cap.get("rest", [{}])[0]
    security = rest.get("security", {})
    print(f"  descripcion seguridad: {security.get('description', '(no especificada)')[:120]}")
    exts = security.get("extension", [])
    oauth_urls = []
    for ext in exts:
        url = ext.get("url", "")
        if "oauth" in url.lower() or "smart" in url.lower():
            oauth_urls.append(url)
            for sub in ext.get("extension", []):
                print(f"  - {sub.get('url', url)}: {sub.get('valueUri', sub.get('valueCode', ''))}")
    if not oauth_urls:
        print("  (Este servidor publico puede no exponer OAuth completo; es normal en sandboxes abiertos.)")


def jwt_backend_services_ejemplo() -> None:
    print("\n=== JWT de ejemplo (SMART Backend Services) ===")
    ahora = int(time.time())
    header = {"alg": "RS384", "typ": "JWT", "kid": "ejemplo-key-1"}
    payload = {
        "iss": "https://backend.integracion-nacional.ejemplo.sv",
        "sub": "https://backend.integracion-nacional.ejemplo.sv",
        "aud": "https://authorization.ejemplo.sv/oauth/token",
        "exp": ahora + 300,
        "jti": str(uuid.uuid4()),
    }
    jwt = f"{b64url(header)}.{b64url(payload)}.FIRMA_RSA_NO_REAL"
    print("Header:")
    print(json.dumps(header, indent=2))
    print("Payload (claims):")
    print(json.dumps(payload, indent=2))
    print("\nJWT (sin firma real, solo demostracion):")
    print(jwt[:80] + "...")
    print("\nClaims clave:")
    print("  iss/sub = identificador de tu cliente backend")
    print("  aud     = URL del endpoint de token OAuth")
    print("  exp     = expiracion corta (minutos)")
    print("  jti     = id unico del JWT (evita replay)")


def well_known_smart() -> None:
    print("\n=== SMART configuration (sandbox publico) ===")
    print(f"GET {SMART_WELL_KNOWN}")
    try:
        resp = requests.get(SMART_WELL_KNOWN, timeout=30)
        if resp.ok:
            cfg = resp.json()
            for clave in ("authorization_endpoint", "token_endpoint", "capabilities"):
                if clave in cfg:
                    print(f"  {clave}: {cfg[clave]}")
        else:
            print(f"  HTTP {resp.status_code} (puede variar segun el sandbox)")
    except requests.RequestException as e:
        print(f"  No disponible: {e}")


def main() -> None:
    print(f"Servidor FHIR: {BASE_URL}\n")
    leer_capability()
    jwt_backend_services_ejemplo()
    well_known_smart()
    print("\nReto: define scopes minimos para signos vitales en PROGRESO.md")


if __name__ == "__main__":
    main()
```


---

## Quiz del dia (repaso con respuestas)

**Tema:** SMART on FHIR practica
**Umbral de maestria:** 80%

Usa estas preguntas para repaso activo. Cubre las respuestas antes de leerlas.

### Pregunta 1 [comprender]
SMART Backend Services se usa cuando...

- a) Hay un usuario clickeando autorizar en el navegador
- b) Un sistema backend necesita acceso sin usuario presente (machine-to-machine) **<- respuesta**
- c) Solo para subir imagenes DICOM
- d) No usa tokens
- **Por que:** Backend Services = flujo sistema a sistema con JWT firmado.

### Pregunta 2 [aplicar]
Claim JWT que evita reutilizar el mismo assertion (replay).

- **Respuestas validas:** jti, el jti
- **Por que:** jti = JWT ID, unico por emision.

### Pregunta 3 [comprender]
El scope 'patient/Observation.read' permite...

- a) Borrar pacientes
- b) Leer observaciones en contexto del paciente autorizado **<- respuesta**
- c) Acceso total de administrador
- d) Solo escribir en el servidor
- **Por que:** El scope limita recurso + operacion + contexto.

### Pregunta 4 [recordar]
Tras obtener access_token, como lo envias a FHIR?

- a) Header Cookie
- b) Authorization: Bearer <token> **<- respuesta**
- c) Query ?password=
- d) En el body del Patient
- **Por que:** Bearer token en cabecera Authorization.

### Pregunta 5 [comprender]
SMART App Launch requiere tipicamente interaccion del usuario para autorizar.

- **Respuesta:** Verdadero
- **Por que:** App Launch = flujo con usuario; Backend Services = sin usuario.


---

## Flashcards (repaso espaciado)

Formato Leitner: cubre el reverso antes de leerlo.

### d17-backend (SMART)
**Frente:** SMART Backend Services vs App Launch
**Reverso:** Backend = sistema a sistema con JWT; App Launch = usuario autoriza en el navegador.

### d17-jti (SMART)
**Frente:** Claim JWT que evita replay de assertions
**Reverso:** jti (JWT ID), unico por emision.


---

## Prompts sugeridos para NotebookLM

Usa estos prompts en el chat de NotebookLM (con este documento como fuente):

1. **Resumen ejecutivo:** "Resume los 5 conceptos clave del Dia 17 (SMART on FHIR practica) en bullets cortos para alguien que implementa FHIR en la integración nacional."

2. **Examen oral:** "Hazme 10 preguntas de dificultad creciente sobre el Dia 17. Espera mi respuesta antes de corregir. Se exigente como un examen HL7."

3. **Feynman:** "Voy a explicarte SMART on FHIR practica con mis palabras. Detecta errores, vacios y ambiguedades."

4. **Tarjetas de memoria:** "Genera 15 tarjetas pregunta-respuesta basadas solo en este material. Formato: pregunta en una linea, respuesta en la siguiente."

5. **Audio Overview:** usa el boton nativo "Audio Overview" de NotebookLM para un repaso escuchando (ideal en commute).

6. **Conexion certificacion:** "Que preguntas de certificacion HL7 FHIR o GCP Healthcare podrian salir de este dia? Indica dominio y dificultad."

7. **Errores comunes:** "Lista los 5 errores mas frecuentes al aplicar lo del Dia 17 en produccion y como evitarlos."
