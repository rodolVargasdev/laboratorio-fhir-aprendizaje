> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

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
python legacy\dias\dia-01\practica\ejercicio_1_local.py
python legacy\dias\dia-01\practica\ejercicio_2_servidor.py
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

---

# Dia 2: JSON a fondo + XML comparado

Objetivo: navegar estructuras JSON anidadas (como las de FHIR) y saber LEER XML.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py` (repaso espaciado).
2. Leccion (con Composer si quieres).
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 2`.

## Teoria

### Anidamiento (estructura en arbol)

Un JSON FHIR real tiene objetos dentro de objetos y arrays dentro de objetos.
Pensar en "rutas" es la clave para no perderse. Ejemplo de Observation (signo vital):

```json
{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [
      { "system": "http://loinc.org", "code": "8867-4", "display": "Frecuencia cardiaca" }
    ],
    "text": "Frecuencia cardiaca"
  },
  "subject": { "reference": "Patient/123" },
  "valueQuantity": { "value": 72, "unit": "latidos/min", "system": "http://unitsofmeasure.org", "code": "/min" }
}
```

Rutas utiles aqui:
- `Observation.code.coding[0].code` -> "8867-4" (el codigo LOINC).
- `Observation.valueQuantity.value` -> 72 (el numero medido).
- `Observation.subject.reference` -> "Patient/123" (a quien pertenece).

Observa el patron CodeableConcept: un objeto con `coding` (lista de codigos
formales) y `text` (texto legible). Lo veras en casi todos los recursos.

### JSON vs XML

FHIR admite ambos. El mismo dato en XML usa etiquetas:

```xml
<Observation xmlns="http://hl7.org/fhir">
  <status value="final"/>
  <code>
    <coding>
      <system value="http://loinc.org"/>
      <code value="8867-4"/>
    </coding>
  </code>
</Observation>
```

Lo que debes saber para el examen:
- En JSON, los valores son directos ("status": "final").
- En XML, los valores suelen ir en el atributo `value` de la etiqueta.
- Los arrays JSON se representan en XML repitiendo la etiqueta.

## Practica

```powershell
python legacy\dias\dia-02\practica\navegar_observation.py
```

Descarga una Observation real y extrae el codigo, el valor y el paciente.
Reto: modifica el script para imprimir tambien `Observation.status`.

## Reto Feynman

Explica en `PROGRESO.md` que es un CodeableConcept y por que tiene a la vez
`coding` (codigos) y `text` (texto libre).