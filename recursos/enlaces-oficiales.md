# Recursos oficiales y servidores de practica

Lista curada y verificada. Empieza por los marcados como (clave).

## Certificacion HL7 FHIR

Tu ruta de 3 metas (orden recomendado) y su estado oficial (junio 2026):
1. Foundational Implementer (entrada, ACTIVO) - tu "Fundacion".
   Nota: el antiguo "FHIR R4 Proficiency" esta EN PAUSA; usa el Foundational.
2. Competencia practica GCP Cloud Healthcare API (no es examen HL7) - tu "Laboratorio".
3. Advanced Developer (ACTIVO, requiere aprobar Foundational) - tu "Maestria".

- (clave) Pagina de certificacion FHIR: https://hl7.org/certification/fhir.cfm
- Examen Foundational Implementer: https://www.hl7.org/training/fhir-exam.cfm
- Examen Advanced Developer: https://www.hl7.org/training/fhir-advanced.cfm
- Curso de preparacion Foundational: https://www.hl7.org/training/fhir-foundational-prep.cfm
- Programa general de certificacion (registro via Webassessor): http://www.hl7.org/certification/

## Herramientas para profiling y validacion (metas 1 y 3)

- FHIR Validator (oficial, Java): https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator
- SUSHI / FSH (definir profiles como codigo): https://fshschool.org/
- Forge (editor visual de profiles): https://simplifier.net/forge
- US Core IG (la guia de implementacion mas usada): https://hl7.org/fhir/us/core/
- Inferno (pruebas de conformidad): https://inferno.healthit.gov/

## Especificacion FHIR (version R4, la del examen)

- (clave) Inicio FHIR R4: http://hl7.org/fhir/R4/
- Lista de recursos: http://hl7.org/fhir/R4/resourcelist.html
- Tipos de datos: http://hl7.org/fhir/R4/datatypes.html
- API REST HTTP: http://hl7.org/fhir/R4/http.html
- Busqueda (search): http://hl7.org/fhir/R4/search.html
- Bundle: http://hl7.org/fhir/R4/bundle.html
- Extensibilidad (extensions): http://hl7.org/fhir/R4/extensibility.html
- Terminologias: http://hl7.org/fhir/R4/terminologies.html
- Validacion: http://hl7.org/fhir/R4/validation.html
- OperationOutcome (errores): http://hl7.org/fhir/R4/operationoutcome.html

## Servidores FHIR publicos de practica (gratis, sin registro)

- (clave) HAPI FHIR R4 (lectura y escritura de pruebas): https://hapi.fhir.org/baseR4
- Firely / Vonk demo server: https://server.fire.ly
- SMART Health IT - servidor de pruebas: https://launch.smarthealthit.org
- SMART Bulk Data (OAuth2 / exportacion): https://bulk-data.smarthealthit.org/

Nota: son servidores compartidos y publicos. NO subas datos reales de pacientes.
Usa solo datos sinteticos o de prueba.

## Datos sinteticos (pacientes ficticios para practicar)

- Synthea (generador de datos clinicos sinteticos): https://synthea.mitre.org/
- Datasets de muestra de Synthea en formato FHIR: https://synthea.mitre.org/downloads

## Google Cloud (semana 2)

- (clave) Cloud Healthcare API: https://cloud.google.com/healthcare-api
- Crear y gestionar FHIR stores: https://cloud.google.com/healthcare-api/docs/how-tos/fhir
- Quickstart por consola: https://docs.cloud.google.com/healthcare-api/docs/store-healthcare-data-console
- Nivel gratuito de GCP: https://cloud.google.com/free

## Comunidad

- Chat oficial FHIR (Zulip): https://chat.fhir.org/
- Portal de formacion HL7: https://www.hl7.org/training/
