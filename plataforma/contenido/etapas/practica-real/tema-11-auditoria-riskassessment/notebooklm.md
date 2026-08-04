# NotebookLM — Auditoria de un RiskAssessment real

> Consolida el tema en un cuaderno: audio, examen oral y mapa mental. El tema no
> se cierra sin este paso.

> **Antes de subir nada:** usa solo la copia anonimizada del recurso (la que está en la
> práctica). Nunca subas a NotebookLM un recurso con datos reales de paciente.

## Pasos

- [ ] Crear un cuaderno llamado **FHIR — Auditoria de un RiskAssessment real** en [notebooklm.google.com](https://notebooklm.google.com).
- [ ] Subir la lección de este tema como fuente (botón "Exportar para NotebookLM").
- [ ] Añadir las fuentes oficiales: riskassessment.html, extensibility.html, datatypes.html#CodeableConcept y clinicalreasoning-module.html (R4).
- [ ] Añadir tu propia tabla de hallazgos (`02-hallazgos.md`) como fuente: el cuaderno debe poder discutir tu auditoría, no solo la teoría.
- [ ] Generar el Audio Overview y escucharlo una vez.
- [ ] Responder un examen oral de 10 preguntas sin mirar el material.

## Prompts sugeridos

- "Interrógame sobre la anatomía de RiskAssessment: qué va en code, method, condition, basis, basedOn y parent, con casos límite."
- "Dame diez recursos con extensiones y pídeme decidir cuál es extensión legítima y cuál debió ir en un elemento del core."
- "Actúa como el arquitecto del orquestador defendiendo el JSON dentro de rationale; yo debo refutarte con argumentos técnicos concretos."
- "Examíname sobre identifier vs id vs status, y sobre cuándo dos coding pertenecen al mismo CodeableConcept."
- "Revisa mi tabla de hallazgos y dime qué me faltó auditar y qué reporté de más."
