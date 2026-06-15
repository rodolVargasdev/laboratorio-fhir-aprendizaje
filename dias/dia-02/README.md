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
python dias\dia-02\practica\navegar_observation.py
```

Descarga una Observation real y extrae el codigo, el valor y el paciente.
Reto: modifica el script para imprimir tambien `Observation.status`.

## Reto Feynman

Explica en `PROGRESO.md` que es un CodeableConcept y por que tiene a la vez
`coding` (codigos) y `text` (texto libre).

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 2 de FHIR. Tema: JSON anidado y XML comparado. Soy
desarrollador intermedio, en espanol, mentalidad Google Cloud. No me des las
respuestas directo: hazme preguntas primero (recuperacion activa), usa analogias
y corrigeme con pistas. Objetivos: (1) navegar JSON anidado con rutas como
Observation.code.coding[0].code, (2) entender el patron CodeableConcept
(coding vs text), (3) saber leer el mismo recurso en XML. Errores a vigilar:
olvidar que coding es un array, confundir 'code' con 'display', no ubicar el
value en atributos XML. Al final pideme que explique CodeableConcept con mis
palabras (Feynman).
