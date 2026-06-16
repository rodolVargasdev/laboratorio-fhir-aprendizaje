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
DoctorSV no sea EE.UU., el examen usa US Core como ejemplo canonico de profiles.
Conocerlo te entrena para leer cualquier IG.

## Practica

```powershell
python dias\dia-16\practica\explorar_profile.py
```

El script:
1. Descarga metadatos del profile US Core Patient desde el servidor publico.
2. Valida un Patient minimo contra ese profile y muestra el OperationOutcome.

Reto: corrige el Patient hasta que el validador reporte cero issues con severity
error (puede quedar warnings; discute con Composer que significan).

## Reto Feynman

En `PROGRESO.md`, explica que es un profile, que aporta StructureDefinition y por
que un Patient valido en R4 base puede fallar contra US Core.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 16. Tema: profiles y StructureDefinition. Soy
desarrollador intermedio en DoctorSV, en espanol, mentalidad GCP-first. Sin darme
respuestas directas, guiame a entender baseDefinition vs differential vs snapshot,
como se identifica un profile por url, y como $validate con parametro profile
detecta incumplimientos. Errores a vigilar: confundir profile con Implementation
Guide completa, creer que R4 base = US Core, ignorar must-support. Al final
pideme explicar profiles con mis palabras (Feynman).
