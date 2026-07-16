# Dia 1: JSON y tu primer contacto con un servidor FHIR

Objetivo del dia: entender JSON y leer un paciente real desde un servidor FHIR.
Tiempo: 2-3 horas. Costo: $0 (servidor publico de pruebas).

## Rutina (sigue siempre este orden)

1. Repaso espaciado: `python evaluacion\repaso.py` (5-10 min; el dia 1 estara casi vacio, normal).
2. Lee esta leccion (idealmente con Composer como guia, ver el prompt al final).
3. Haz la practica.
4. Reto Feynman (abajo).
5. Quiz: `python evaluacion\quiz_runner.py --dia 1` y apunta tu % en `PROGRESO.md`.

## Por que empezamos por JSON

FHIR intercambia informacion clinica principalmente en formato JSON. Si lees
JSON con soltura, ya tienes ganada la mitad de la base que el examen da por sabida.

## Teoria con analogia

JSON (JavaScript Object Notation) escribe datos como texto que humanos y programas
entienden. Analogia: una ficha de paciente con casillas.
- Un par "clave": valor es una casilla con su etiqueta y su dato.
- Un objeto { } agrupa casillas.
- Un array [ ] es una lista (por ejemplo, varios telefonos).

Ejemplo minimo de Patient:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo-1",
  "active": true,
  "name": [
    { "use": "official", "family": "Hernandez", "given": ["Maria", "Jose"] }
  ],
  "gender": "female",
  "birthDate": "1985-04-12"
}
```

Notas clave:
- `resourceType` indica el tipo de recurso (aqui Patient).
- `name` es un array porque una persona puede tener varios nombres.
- Dentro de name, `given` es otro array (varios nombres de pila).

### Rutas dentro del JSON (clave en FHIR)

El apellido del ejemplo es `Patient.name[0].family` -> "Hernandez".
Se lee: del Patient, el primer (indice 0) elemento de name, su campo family.
Esta notacion la veras constantemente en FHIR.

## Practica

Desde la terminal (con el entorno activado):

```powershell
python dias\dia-01\practica\ejercicio_1_local.py
python dias\dia-01\practica\ejercicio_2_servidor.py
```

- `ejercicio_1_local.py` lee un Patient desde un archivo local (sin internet).
- `ejercicio_2_servidor.py` descarga un Patient real del servidor publico HAPI.

Reto practico: en `ejercicio_1_local.py`, donde dice "RETO", escribe el codigo
para imprimir la fecha de nacimiento y el genero del paciente.

## Reto Feynman

En `PROGRESO.md`, escribe en 3-4 lineas, con tus palabras, que es JSON y por que
FHIR lo usa, como si se lo explicaras a un companero que nunca lo vio.

## Autoevaluacion rapida

1. .Por que `name` esta entre corchetes [ ]?
2. .Cual es la ruta para el primer nombre de pila (given)?
3. .Que campo dice siempre el tipo de recurso FHIR?

(Respuestas: 1, permite varios nombres; 2, Patient.name[0].given[0]; 3, resourceType.)

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor personal para el Dia 1 de mi preparacion FHIR. Tema: JSON y
primer GET a un servidor FHIR. Mi perfil: desarrollador intermedio, en espanol,
con mentalidad Google Cloud. Reglas: no me des las respuestas de inmediato;
primero hazme preguntas y dejame intentar (recuperacion activa); usa analogias
simples y ejemplos concretos; si fallo, corrigeme con una pista. Objetivos de
hoy: (1) leer JSON con soltura, (2) entender objetos vs arrays, (3) usar rutas
tipo Patient.name[0].family, (4) hacer mi primer GET a un servidor FHIR.
Errores comunes que debes vigilar: confundir objeto con array, olvidar que name
y given son arrays, no distinguir clave de valor. Empieza preguntandome que se
de JSON y guiame paso a paso. Al final, pideme que te explique con mis palabras
que es JSON y por que FHIR lo usa (tecnica Feynman) y detecta mis vacios.
