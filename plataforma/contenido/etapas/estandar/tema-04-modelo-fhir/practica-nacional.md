## Tema 4 · Modelo FHIR -> Una consulta médica en recursos

- Práctica (60-90 min, PC): toma una consulta externa típica (paciente llega,
  se toman signos vitales, el médico diagnostica y receta) y modélala: `Patient`,
  `Encounter`, 2-3 `Observation` (presión, peso), `Condition` y `MedicationRequest`,
  todos enlazados por referencias correctas. Valida el JSON con el servidor.
- Entregable: `institucion/tema-04/consulta-externa/` (un archivo por recurso + diagrama de referencias).
- Esto demuestra: el mapa recurso-por-recurso del flujo clínico central del sistema.