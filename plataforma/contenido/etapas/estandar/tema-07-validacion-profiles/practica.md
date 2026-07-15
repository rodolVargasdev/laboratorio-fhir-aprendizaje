> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

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
python legacy\dias\dia-15\practica\validar_recursos.py
```

El script valida un Patient **valido** y uno **invalido** (sin name) y muestra
como leer el OperationOutcome. Reto: agrega una tercera prueba con un Observation
sin `status` y corrige el JSON hasta que pase.

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre "JSON valido" y "recurso FHIR valido",
y que campos mirarias primero en un OperationOutcome.

---

# Dia 16: Profiles y StructureDefinition

Objetivo: entender que es un profile, como se representa con StructureDefinition y
como validar una instancia contra un profile (base del Advanced Developer).
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 16`

## Teoria

### El estandar base vs un profile

El estandar FHIR R4 define recursos **generales** (Patient, Observation...). En la
practica real, cada pais, sistema o guia (Implementation Guide) **restringe** el
estandar: "nuestro Patient debe tener estos campos obligatorios adicionales".

Eso es un **profile**: una StructureDefinition que dice como debe verse un recurso
para un caso de uso concreto.

Analogia: el estandar base es el molde generico de galleta; el profile es el
cortador con forma especifica que encaja en una receta concreta (US Core, IPS...).

### StructureDefinition (piezas clave)

- **url**: identificador canonico del profile (ej.
  `http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient`).
- **type**: a que recurso aplica (Patient, Observation...).
- **baseDefinition**: de que recurso/profile hereda (casi siempre el R4 base).
- **kind**: `resource` para profiles de recursos.
- **differential**: que cambia respecto al base (elementos restringidos, nuevos
  obligatorios, extensiones permitidas).
- **snapshot**: vista completa expandida del profile (util para validadores).

### Validar contra un profile

Puedes pedir al servidor que valide una instancia contra un profile concreto:

    POST [base]/Patient/$validate?profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient

Si la instancia no cumple el profile, OperationOutcome listara los issues.

### US Core (referencia para el examen)

US Core es la Implementation Guide mas estudiada internacionalmente. Aunque
la integración nacional no sea EE.UU., el examen usa US Core como ejemplo canonico de profiles.
Conocerlo te entrena para leer cualquier IG.

## Practica

```powershell
python legacy\dias\dia-16\practica\explorar_profile.py
```

El script:
1. Descarga metadatos del profile US Core Patient desde el servidor publico.
2. Valida un Patient minimo contra ese profile y muestra el OperationOutcome.

Reto: corrige el Patient hasta que el validador reporte cero issues con severity
error (puede quedar warnings; discute con Composer que significan).

## Reto Feynman

En `PROGRESO.md`, explica que es un profile, que aporta StructureDefinition y por
que un Patient valido en R4 base puede fallar contra US Core.