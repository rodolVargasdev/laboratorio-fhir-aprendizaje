## Tema 11 · Auditoría de un RiskAssessment real -> El primer borrador del IG nacional

- Práctica (120 min, PC): este tema ES la práctica nacional. El insumo no es un ejemplo
  de HAPI sino un recurso emitido por nuestro orquestador de prevención y almacenado en
  Cloud Healthcare API. Audítalo, refactorízalo y perfílalo siguiendo los cinco
  ejercicios guiados.
- Entregable: `institucion/tema-11/` completo — `02-hallazgos.md` (tabla con ruta
  FHIRPath, regla citada y severidad), `03-refactor.json` aceptado como transaction,
  `prevencion.fsh` compilado con SUSHI y `05-validate-comparado.md`.
- Entregable de gobernanza: una página que zanje la canónica institucional
  (`http://goes.gob.sv/fhir/` vs `https://fhir.salud.gob.sv/` del tema 10), la
  convención de URLs para CodeSystem/ValueSet/StructureDefinition, y quién es dueño del
  catálogo de fases de prevención.
- Esto demuestra: que el laboratorio dejó de ser teoría. Los perfiles y CodeSystems que
  salen de aquí son el primer contenido publicable de la guía de implementación
  nacional, y la tabla de hallazgos es la conversación que hay que tener con el equipo
  del orquestador antes de que un tercer sistema consuma el blob de `rationale`.
