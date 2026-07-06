# Prácticas institucionales — FHIR aplicado a DoctorSV / El Salvador

Una práctica por tema. La idea: cada concepto que aprendes en la ruta lo aterrizas
**el mismo día** en un artefacto útil para tu institución. Al terminar la ruta no
solo pasas quizzes: tienes un **portafolio de 11 entregables** que juntos forman el
borrador de una propuesta de interoperabilidad FHIR para DoctorSV.

Reglas de oro:
- **Datos SIEMPRE ficticios** (nombres, DUI y expedientes inventados). Nunca datos reales.
- Guarda cada entregable en `institucion/tema-XX/` (crea la carpeta al hacer la primera).
- Al cerrar cada práctica, anota 2-3 líneas en la bitácora de `PROGRESO.md`.

---

## Tema 0 · Por qué existe FHIR → El diagnóstico institucional

**Pregunta guía:** ¿en qué punto de la historia HL7 está tu institución hoy?

- Práctica (30-45 min, celular o PC): escribe 1 página que responda:
  ¿cómo se comparte hoy la información clínica en DoctorSV y con otras instituciones
  (MINSAL, ISSS, laboratorios)? ¿PDF, Excel, oficios, APIs propias? ¿Dónde se
  parece eso al mundo pre-FHIR (v2/v3) que leíste?
- Entregable: `institucion/tema-00/diagnostico-interoperabilidad.md`
- Esto demuestra: puedes justificar ANTE la institución por qué FHIR, con contexto histórico.

## Tema 1 · JSON y XML → El paciente salvadoreño en FHIR

- Práctica (45 min, PC): escribe a mano un `Patient` JSON válido para un paciente
  ficticio salvadoreño: nombre con dos apellidos (`family` + extensión o convención
  que decidas documentar), `identifier` con DUI ficticio (inventa un `system` tipo
  `https://doctorsv.gob.sv/identificadores/dui`) y otro con número de expediente,
  teléfono +503, dirección con departamento/municipio.
- Entregable: `institucion/tema-01/paciente-sv.json` + notas de qué decisiones tomaste.
- Esto demuestra: sabes mapear la identidad del paciente salvadoreño al modelo FHIR.

## Tema 2 · HTTP y REST → El expediente viaja por la red

- Práctica (60 min, PC): usando el servidor HAPI público (o tu HAPI local), haz el
  ciclo completo con TU `paciente-sv.json`: POST (crear), GET por id, búsqueda por
  `identifier` (el DUI ficticio), PUT (corregir un teléfono), y captura los códigos
  de estado de cada paso.
- Entregable: `institucion/tema-02/ciclo-crud-expediente.md` (comandos + códigos + aprendizajes).
- Esto demuestra: el flujo real de un expediente DoctorSV sobre una API FHIR.

## Tema 3 · Seguridad → ¿Quién puede ver un expediente?

- Práctica (45 min, celular o PC): tabla de actores de DoctorSV (médico, enfermera,
  farmacia, paciente, sistema de reportes MINSAL) → para cada uno define los scopes
  SMART que necesitaría (ej. médico: `user/Patient.rs user/Observation.cruds`;
  reportes: `system/Observation.rs`). Justifica cada uno con menor privilegio.
- Entregable: `institucion/tema-03/matriz-scopes-doctorsv.md`
- Esto demuestra: puedes diseñar el modelo de autorización clínica de la institución.

## Tema 4 · Modelo FHIR → Una consulta de DoctorSV en recursos

- Práctica (60-90 min, PC): toma una consulta externa típica (paciente llega,
  se toman signos vitales, el médico diagnostica y receta) y modélala: `Patient`,
  `Encounter`, 2-3 `Observation` (presión, peso), `Condition` y `MedicationRequest`,
  todos enlazados por referencias correctas. Valida el JSON con el servidor.
- Entregable: `institucion/tema-04/consulta-externa/` (un archivo por recurso + diagrama simple de referencias).
- Esto demuestra: el mapa recurso-por-recurso del flujo clínico central de DoctorSV.

## Tema 5 · Búsqueda → Las preguntas que hace la institución

- Práctica (60 min, PC): escribe y ejecuta (contra HAPI con tus datos del Tema 4)
  las 5 búsquedas que DoctorSV haría a diario, p. ej.: pacientes por DUI; encuentros
  de hoy; observaciones de presión arterial altas del último mes (`code=` + prefijo `ge`);
  medicamentos activos de un paciente (`_include`); pacientes de un municipio.
- Entregable: `institucion/tema-05/busquedas-operativas.md` (URL exacta + para qué sirve + resultado).
- Esto demuestra: FHIR responde las preguntas operativas reales de la institución.

## Tema 6 · Terminologías → Hablar el mismo idioma clínico

- Práctica (60 min, PC/celular): elige 10 conceptos frecuentes en DoctorSV
  (hipertensión, diabetes tipo 2, glucosa en sangre, presión sistólica, dengue…)
  y encuentra su código: SNOMED CT para diagnósticos, LOINC para mediciones.
  Documenta el `system`, `code` y `display` de cada uno y arma un mini-ValueSet
  JSON "Diagnósticos frecuentes DoctorSV".
- Entregable: `institucion/tema-06/terminologia-base.md` + `valueset-diagnosticos.json`
- Esto demuestra: la semilla del catálogo terminológico institucional (clave para reportes al MINSAL).

## Tema 7 · Validación y Profiles → Las reglas salvadoreñas

- Práctica (90 min, PC): redacta en texto (aún sin herramientas) el profile
  "PacienteDoctorSV": qué elementos del `Patient` base vuelves obligatorios (DUI o
  expediente, municipio…), qué cardinalidades cambias y qué extensión necesitarías.
  Luego valida tu `paciente-sv.json` con `$validate` contra el servidor y analiza
  el `OperationOutcome`.
- Entregable: `institucion/tema-07/profile-paciente-sv.md` (+ salida de $validate comentada).
- Esto demuestra: el primer borrador de una guía de implementación nacional/institucional.

## Tema 8 · Google Cloud → El piloto de infraestructura

- Práctica (90 min, PC): en tu proyecto GCP free tier crea `dataset=doctorsv-piloto`
  con un FHIR store R4, súbele tus recursos de los temas 4-6 y repite las búsquedas
  del Tema 5 contra TU store con token. Cierra con la guía de limpieza (costo $0).
- Entregable: `institucion/tema-08/piloto-gcp.md` (arquitectura, comandos, costos, qué haría falta en producción: IAM, auditoría, respaldo).
- Esto demuestra: sabes montar y operar la infraestructura FHIR del piloto institucional.

## Tema 9 · SMART en práctica → El acceso sistema-a-sistema

- Práctica (60 min, PC): diseña el flujo Backend Services para un caso real:
  "el sistema de reportes epidemiológicos consulta cada noche las Observations
  nuevas". Diagrama el flujo JWT→token→consulta, define scopes mínimos y pruébalo
  contra el sandbox SMART Bulk Data.
- Entregable: `institucion/tema-09/integracion-reportes.md`
- Esto demuestra: el patrón de integración segura entre sistemas del Estado.

## Tema 10 · Proyecto integrador → La propuesta DoctorSV

- Práctica (el mini-proyecto del día 13, versión institucional): script Python
  end-to-end que registre una consulta completa (Tema 4) en tu FHIR store y genere
  un resumen clínico del paciente. Después, une TODOS los entregables anteriores en
  un documento de 3-5 páginas: **"Propuesta: interoperabilidad FHIR para DoctorSV"**
  (diagnóstico → modelo → terminología → seguridad → infraestructura → piloto).
- Entregable: `institucion/tema-10/propuesta-fhir-doctorsv.md` + código del proyecto.
- Esto demuestra: nivel amateur sólido COMPLETO, con evidencia presentable a tu institución.

---

## Cómo encaja con la ruta

Haz la práctica institucional **al cerrar cada tema** (después del quiz ≥ 80 %).
Suma 30-90 min por tema, y es la diferencia entre "pasé el quiz" y "puedo
proponer esto en mi trabajo". El portafolio `institucion/` completo es, además,
la evidencia de experiencia práctica que HL7 recomienda antes del examen.
