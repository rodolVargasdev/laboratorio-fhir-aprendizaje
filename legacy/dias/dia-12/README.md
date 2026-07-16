# Dia 12: El modelo FHIR (recursos, referencias y Bundle)

Objetivo: conocer los recursos mas comunes, como se relacionan y como recorrer un
Bundle; y mapear un caso de uso de la integración nacional a recursos FHIR.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 12`.

## Teoria

### Recursos comunes (los que mas veras)

- Patient: la persona atendida (datos demograficos).
- Practitioner: el profesional de salud.
- Organization: hospital, clinica, aseguradora.
- Encounter: una visita/atencion (consulta, ingreso).
- Condition: un diagnostico o problema.
- Observation: una medicion o hallazgo (signos vitales, laboratorio).
- MedicationRequest: una prescripcion.

### Como se relacionan

Casi todo gira alrededor del Patient. Ejemplo de una consulta:
- Encounter.subject -> Patient
- Condition.subject -> Patient, Condition.encounter -> Encounter
- Observation.subject -> Patient, Observation.encounter -> Encounter

### Bundle

Un Bundle agrupa recursos. Tipos frecuentes:
- searchset: resultados de una busqueda.
- transaction / batch: varios cambios enviados juntos.
- document: un documento clinico estructurado.
- collection: una coleccion generica.

Recorrer un Bundle = iterar su array `entry`, donde cada entrada tiene un
`resource`.

### Caso de uso la integración nacional (ejemplo a mapear)

"Un paciente llega a consulta, el medico registra presion arterial y le
diagnostica hipertension, y le receta un medicamento."
Mapeo: Patient (paciente) + Practitioner (medico) + Encounter (la consulta) +
Observation (presion arterial, LOINC) + Condition (hipertension, SNOMED/ICD-10) +
MedicationRequest (la receta).

## Practica

```powershell
python dias\dia-12\practica\recorrer_bundle.py
```

Recorre un Bundle de ejemplo (incluido, sin internet) y muestra que recursos
contiene y como se enlazan. Reto: identifica en la salida que Observation
pertenece a que Patient siguiendo la referencia.

## Reto Feynman

En `PROGRESO.md`, mapea con tus palabras un caso de uso real de la integración nacional (el que
quieras) a recursos FHIR y sus referencias.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 12. Tema: modelo FHIR (Patient, Encounter,
Observation, Condition, MedicationRequest), referencias y Bundle. Soy
desarrollador intermedio en la integración nacional, en espanol, mentalidad GCP-first. Sin darme
respuestas directas, hazme mapear casos de uso clinicos a recursos y referencias,
y recorrer mentalmente un Bundle. Errores a vigilar: meter todo en un solo
recurso, olvidar las referencias entre Encounter/Observation/Condition y Patient.
Al final pideme mapear un caso de uso de la integración nacional a recursos FHIR (Feynman).
