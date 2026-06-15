# Laboratorio de aprendizaje: cimientos de software para FHIR (enfoque Google Cloud)

Este workspace es tu laboratorio personal para prepararte, en 2 semanas, para
estudiar el estandar HL7 FHIR de cara a la certificacion, desde el rol de
desarrollador e implementador de la division de desarrollo de DoctorSV El Salvador.

## Idea central

Durante estas 2 semanas NO se aprende FHIR a profundidad todavia. Se construyen
los cimientos de software que el examen de certificacion da por sabidos, y se deja
montado el entorno (incluido Google Cloud) para que el estudio posterior de FHIR
sea fluido.

Metodologia: "aprender haciendo + repeticion espaciada".
Cada tema tiene: explicacion simple con analogia, ejemplo concreto, y un
mini-ejercicio que tu ejecutas y verificas.

## Contexto de la certificacion (resumen verificado en HL7)

HL7 International ofrece dos niveles tecnicos:

- FHIR Foundational Implementer (entrada): 100 preguntas, opcion multiple, 3 horas,
  libro cerrado, se aprueba con 60%. Es el punto de partida obligatorio.
- FHIR Advanced Developer (avanzado): requiere aprobar primero el Foundational.
  Se aprueba con 65%.

Nota honesta: HL7 recomienda alrededor de 6 meses de experiencia real con FHIR
antes del examen Foundational. Por eso estas 2 semanas son para cimientos y
entorno, no para presentar el examen.

## Prerrequisitos de software que cubre este laboratorio

Tomados de la guia oficial de competencias del examen:

- JSON y XML (leer y entender la estructura)
- APIs REST (metodos HTTP, codigos de estado, busqueda)
- Seguridad web: OAuth 2.0 y su perfil sanitario SMART on FHIR
- Nociones de terminologias clinicas (LOINC, SNOMED, CodeableConcept)
- Herramientas de desarrollo: Git, Python, cliente REST
- Google Cloud Healthcare API (servidor FHIR R4 gestionado)

## Como usar este workspace

1. Empieza por `00-setup/README.md` para dejar tu entorno listo.
2. Sigue el calendario en `PLAN-2-SEMANAS.md`, dia por dia.
3. Marca tu avance en `PROGRESO.md` (es tu tablero de control).
4. Los ejercicios viven en cada modulo `01-...`, `02-...`, etc.
5. Cuando dudes de un concepto, cada leccion incluye una autoevaluacion corta.

## Estructura

- `00-setup/` Preparacion del entorno de trabajo
- `01-fundamentos-software/` JSON, REST, OAuth/SMART, terminologias
- `02-gcp/` Google Cloud: cuenta, facturacion y Healthcare API
- `03-fhir-intro/` Primer contacto con recursos FHIR (al final de las 2 semanas)
- `recursos/` Enlaces oficiales y servidores de practica gratuitos
- `PLAN-2-SEMANAS.md` Calendario detallado
- `PROGRESO.md` Tablero de seguimiento
- `requirements.txt` Dependencias de Python
