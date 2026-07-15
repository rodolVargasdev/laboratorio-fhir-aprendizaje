# Dia 6: Seguridad web - OAuth 2.0 y SMART on FHIR

Objetivo: entender autenticacion vs autorizacion, como funcionan los tokens
(OAuth 2.0) y que aporta SMART on FHIR en salud.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 6`.

## Teoria con analogia

- Autenticacion (authn): demostrar QUIEN eres. Analogia: mostrar tu DUI/pasaporte.
- Autorizacion (authz): que tienes PERMITIDO hacer. Analogia: tu boleto dice a que
  zonas del concierto puedes entrar.

### OAuth 2.0

Es un marco de AUTORIZACION. Permite que una app obtenga acceso limitado a un
recurso sin conocer tu contrasena, usando un "access token" (una credencial
temporal). Analogia: la llave de hotel: abre tu cuarto por unos dias, no es la
llave maestra ni revela tu identidad al cerrajero.

Piezas tipicas: cliente (la app), servidor de autorizacion (emite tokens),
servidor de recursos (los datos, aqui el servidor FHIR), y los "scopes"
(alcance del permiso).

### SMART on FHIR

Es un perfil sobre OAuth 2.0 pensado para apps de salud. Estandariza:
- Como una app pide autorizacion para leer/escribir datos FHIR.
- Los "scopes" tipo `patient/Observation.read` (leer observaciones del paciente)
  o `system/Patient.read` (acceso a nivel de sistema).
- SMART App Launch (apps lanzadas desde un portal/EHR) y SMART Backend Services
  (sistema-a-sistema, sin usuario, usando un JWT firmado con clave privada).

### JWT (JSON Web Token)

Muchos access tokens son JWT: un texto con tres partes separadas por puntos
(header.payload.signature). Header y payload son JSON codificados en base64url
(legibles); la firma garantiza que no fue alterado. El payload lleva "claims"
como quien lo emitio (iss), para quien (aud), expiracion (exp) y los scopes.

## Practica

```powershell
python dias\dia-06\practica\decodificar_jwt.py
```

Decodifica un JWT de EJEMPLO (incluido, no real) y muestra su header y payload.
Reto: identifica en el payload el claim de expiracion (exp) y los scopes.

Opcional (sin codigo): abre https://bulk-data.smarthealthit.org/ y observa las
opciones de autenticacion (JWKS, scopes). Es el sandbox oficial de SMART.

## Reto Feynman

En `PROGRESO.md`, explica con tus palabras la diferencia entre autenticacion y
autorizacion, y que es un scope en SMART on FHIR.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 6 de FHIR. Tema: OAuth 2.0 y SMART on FHIR. Soy
desarrollador intermedio, en espanol, mentalidad Google Cloud. No me des
respuestas directas: preguntame primero (recuperacion activa) y corrige con
pistas. Objetivos: (1) distinguir autenticacion de autorizacion, (2) entender el
flujo basico de OAuth 2.0 y el access token, (3) saber que aporta SMART on FHIR y
que es un scope (patient/Observation.read), (4) reconocer las partes de un JWT.
Errores a vigilar: confundir authn con authz, creer que el token revela la
contrasena, no entender los scopes. Al final pideme que explique authn vs authz y
scopes (Feynman).
