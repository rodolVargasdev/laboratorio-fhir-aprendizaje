# Dia 15: Validacion con $validate y OperationOutcome

Objetivo: entender como un servidor FHIR valida recursos, interpretar errores en
OperationOutcome y corregir instancias invalidas. Clave para Foundational
(troubleshooting 13-19%) y GCP (rechazo de datos mal formados).
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion (con Composer si quieres).
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 15`

## Teoria

### Por que validar

Un recurso FHIR puede ser JSON valido pero **invalido como FHIR** (falta un campo
obligatorio, tipo incorrecto, referencia rota). Los servidores y el examen esperan
que sepas detectar y corregir esos problemas.

### La operacion $validate

Invocas la operacion de validacion enviando el recurso en el cuerpo:

    POST [base]/Patient/$validate
    Content-Type: application/fhir+json

Opcionalmente puedes pedir validacion contra un **profile**:

    POST [base]/Patient/$validate?profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient

El servidor responde con un **OperationOutcome** (aunque el HTTP sea 200).

### OperationOutcome (como leer errores)

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "required",
      "diagnostics": "Patient.name: minimum required = 1, but only found 0",
      "location": ["Patient.name"]
    }
  ]
}
```

Campos clave de cada `issue`:
- **severity**: fatal | error | warning | information
- **code**: tipo de problema (required, invalid, structure, ...)
- **diagnostics**: mensaje legible (tu mejor amigo para depurar)
- **location**: ruta al elemento problematico (ej. Patient.name)

Analogia: OperationOutcome es el "informe de revision" del profesor cuando entregas
una tarea con errores marcados en rojo.

### Errores HTTP vs OperationOutcome

- **422 Unprocessable Entity**: el servidor rechazo crear/actualizar el recurso.
  Suele incluir OperationOutcome en el cuerpo.
- **200 con OperationOutcome**: en $validate, "ok" puede significar "procesado";
  mira si hay issues con severity error/fatal.

## Practica

```powershell
python dias\dia-15\practica\validar_recursos.py
```

El script valida un Patient **valido** y uno **invalido** (sin name) y muestra
como leer el OperationOutcome. Reto: agrega una tercera prueba con un Observation
sin `status` y corrige el JSON hasta que pase.

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre "JSON valido" y "recurso FHIR valido",
y que campos mirarias primero en un OperationOutcome.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 15. Tema: operacion $validate y OperationOutcome. Soy
desarrollador intermedio en la integración nacional, en espanol, mentalidad GCP-first. Sin darme
respuestas directas, hazme razonar como invocar $validate, que significa cada
severity/code en issue, y como usar diagnostics/location para corregir un recurso.
Errores a vigilar: confundir 200 HTTP con "sin errores", ignorar location,
no distinguir JSON valido de FHIR valido. Al final pideme explicar OperationOutcome
(Feynman).
