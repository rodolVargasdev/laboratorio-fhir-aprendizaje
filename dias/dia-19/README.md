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
python dias\dia-19\practica\terminologia_avanzada.py
```

Usa el servidor de terminologia publico tx.fhir.org para $expand y $lookup.
Reto: valida un codigo LOINC con $validate-code.

## Reto Feynman

Explica la diferencia entre CodeSystem y ValueSet con un ejemplo de signos vitales.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 19. Tema: terminologia FHIR (CodeSystem, ValueSet,
ConceptMap, $expand, $lookup). Soy desarrollador intermedio en DoctorSV, en
espanol. Sin respuestas directas: guiame a usar $expand y explicar binding.
Errores: confundir CodeSystem con ValueSet, olvidar system en Coding.
Al final pideme la diferencia CodeSystem vs ValueSet (Feynman).
