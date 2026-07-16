# Dia 3: HTTP y REST (parte 1)

Objetivo: entender el modelo cliente-servidor, las URLs y los metodos HTTP, y
hacer lecturas (GET) de distintos tipos de recurso FHIR.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 3`.

## Teoria con analogia

REST es un estilo para que un cliente (tu app) pida cosas a un servidor por HTTP.
Analogia: un restaurante. La URL es la mesa/plato que pides; el metodo HTTP es la
accion (ver el menu, pedir, cambiar, cancelar).

Metodos HTTP principales (en FHIR):
- GET: leer (no cambia nada). Ej: ver un paciente.
- POST: crear algo nuevo (el servidor asigna el id).
- PUT: crear o reemplazar un recurso con id conocido.
- DELETE: borrar.

Anatomia de una URL FHIR:

    https://hapi.fhir.org/baseR4 / Patient / 123
    \______ base del servidor ___/ \_tipo_/ \id/

Cabeceras (headers) utiles:
- `Accept: application/fhir+json` -> "respondeme en JSON".
- `Content-Type: application/fhir+json` -> "lo que te envio es JSON" (en POST/PUT).

Interacciones de lectura en FHIR:
- read: GET [base]/Patient/123 (un recurso concreto).
- search: GET [base]/Patient?family=Perez (busqueda, devuelve un Bundle).
- vread (version): GET [base]/Patient/123/_history/1 (una version concreta).

## Practica

```powershell
python dias\dia-03\practica\explorar_rest.py
```

Hace GET de varios tipos (Patient, Observation, Organization) y muestra el
codigo de estado y cuantos resultados llegaron.
Reto: agrega un tipo mas (por ejemplo, "Practitioner") a la lista del script.

## Reto Feynman

En `PROGRESO.md`, explica con tus palabras la diferencia entre 'read' y 'search'
en FHIR, y por que search devuelve un Bundle.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 3 de FHIR. Tema: HTTP y REST (lecturas). Soy
desarrollador intermedio, en espanol, mentalidad Google Cloud. No me des
respuestas directas: preguntame primero (recuperacion activa) y corrige con
pistas. Objetivos: (1) entender cliente-servidor y la anatomia de una URL FHIR,
(2) distinguir GET/POST/PUT/DELETE, (3) diferenciar read vs search vs vread,
(4) usar cabeceras Accept y Content-Type. Errores a vigilar: creer que GET puede
modificar datos, confundir read con search, olvidar que search devuelve un
Bundle. Al final pideme que explique read vs search (Feynman).
