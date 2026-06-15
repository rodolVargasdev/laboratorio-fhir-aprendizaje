# Dia 11: Terminologias clinicas (LOINC, SNOMED, UCUM)

Objetivo: entender por que la salud necesita vocabularios estandar y como FHIR
los usa con Coding / CodeableConcept y la fuerza de binding.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 11`.

## Teoria con analogia

Si un sistema escribe "glucosa" y otro "azucar en sangre", las maquinas no saben
que es lo mismo. Las terminologias son diccionarios universales con codigos para
que todos hablen igual. Analogia: el codigo de barras de un producto; sin importar
el idioma del envase, el codigo identifica el producto exacto.

Las tres mas importantes:
- LOINC: identifica QUE se midio u observo (analisis de laboratorio, signos
  vitales). Ej: 8867-4 = frecuencia cardiaca.
- SNOMED CT: conceptos clinicos (diagnosticos, hallazgos, procedimientos).
- UCUM: unidades de medida (mg, mmol/L, /min...).

### Coding vs CodeableConcept

- Coding: UN codigo concreto -> { system, code, display }.
  - system: la URL del vocabulario (http://loinc.org).
  - code: el codigo (8867-4).
  - display: el texto humano ("Frecuencia cardiaca").
- CodeableConcept: puede tener VARIOS coding (el mismo concepto en distintos
  vocabularios) mas un `text` libre.

### Fuerza de binding (binding strength)

Indica que tan obligatorio es usar codigos de un value set concreto:
- required: obligatorio usar ese conjunto.
- extensible: usa ese conjunto salvo que no exista un codigo adecuado.
- preferred: recomendado, no obligatorio.
- example: solo ilustrativo.

## Practica

```powershell
python dias\dia-11\practica\terminologias.py
```

Examina observaciones reales y reporta que sistemas de codigos aparecen,
traduciendo las URLs de system a nombres (LOINC, SNOMED, UCUM).
Reto: agrega al diccionario del script otro system (por ejemplo, RxNorm para
medicamentos: http://www.nlm.nih.gov/research/umls/rxnorm).

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre Coding y CodeableConcept y por que
existen las cuatro fuerzas de binding.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 11. Tema: terminologias clinicas (LOINC, SNOMED,
UCUM), Coding vs CodeableConcept y fuerza de binding. Soy desarrollador
intermedio, en espanol, mentalidad GCP-first. Sin darme respuestas directas,
hazme razonar para que sirve cada vocabulario, las partes de un Coding
(system/code/display) y las cuatro fuerzas de binding. Errores a vigilar:
confundir LOINC (que se midio) con SNOMED (concepto clinico), olvidar el system,
creer que CodeableConcept es un solo codigo. Al final pideme explicar Coding vs
CodeableConcept (Feynman).
