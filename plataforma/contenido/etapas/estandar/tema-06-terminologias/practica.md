> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

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
python legacy\dias\dia-11\practica\terminologias.py
```

Examina observaciones reales y reporta que sistemas de codigos aparecen,
traduciendo las URLs de system a nombres (LOINC, SNOMED, UCUM).
Reto: agrega al diccionario del script otro system (por ejemplo, RxNorm para
medicamentos: http://www.nlm.nih.gov/research/umls/rxnorm).

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre Coding y CodeableConcept y por que
existen las cuatro fuerzas de binding.

---

# Dia 19: Terminologia avanzada (CodeSystem, ValueSet, ConceptMap, $expand)

Objetivo: usar servicios de terminologia FHIR: expandir ValueSets, entender
CodeSystem y ConceptMap. Clave en Foundational (terminology) y Advanced.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 19`

## Teoria

### Tres recursos de terminologia

| Recurso | Para que sirve |
|---------|----------------|
| **CodeSystem** | Define un vocabulario/codigos (ej. LOINC, SNOMED) |
| **ValueSet** | Selecciona un subconjunto de codigos de uno o mas CodeSystems |
| **ConceptMap** | Mapea codigos entre vocabularios (traduccion) |

### Binding (en profiles)

Un elemento en un profile puede exigir codigos de un ValueSet concreto
(required, extensible, preferred, example).

### Operacion $expand

Expande un ValueSet a la lista de codigos concretos (o valida si un codigo
pertenece al set):

    GET [base]/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender

Servidor publico de terminologia: **https://tx.fhir.org/r4**

### $lookup y $validate-code

- **$lookup**: dado system+code, devuelve display y propiedades.
- **$validate-code**: comprueba si un codigo es valido en un ValueSet.

## Practica

```powershell
python legacy\dias\dia-19\practica\terminologia_avanzada.py
```

Usa el servidor de terminologia publico tx.fhir.org para $expand y $lookup.
Reto: valida un codigo LOINC con $validate-code.

## Reto Feynman

Explica la diferencia entre CodeSystem y ValueSet con un ejemplo de signos vitales.