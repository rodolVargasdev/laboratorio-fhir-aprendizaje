# Plan del resto del anio: 3 certificaciones con metodo medible

Este plan toma tus 2 semanas de cimientos y las extiende a una ruta de 4-12 meses
hacia tres metas, en el orden que tu definiste:

1. HL7 FHIR Foundational Implementer  (tu "Fundacion" / antiguo Proficiency)
2. Competencia practica en GCP Cloud Healthcare API  (tu "Laboratorio")
3. HL7 FHIR Advanced Developer  (tu "Maestria tecnica")

Nota oficial (verificada en HL7, junio 2026): el examen de ENTRADA hoy se llama
"Foundational Implementer"; el antiguo "FHIR R4 Proficiency" esta en pausa
(on hold). El "Advanced Developer" exige aprobar primero el Foundational (o tener
el Proficiency legacy). Por eso tu paso 1 apunta al Foundational Implementer.

---

## Como sabremos, con NUMEROS, que estas aprendiendo y que estas listo

No usamos sensaciones. Usamos un calculador objetivo:

    python evaluacion\preparacion.py

Te da, para cada certificacion, un PUNTAJE DE PREPARACION (0-100) y un semaforo
(ROJO/AMARILLO/VERDE). Esta basado en investigacion sobre que predice aprobar un
examen: no una nota suelta, sino una combinacion de senales.

Puntaje compuesto (pesos respaldados por la literatura de "exam readiness"):
- 35% Cobertura por dominio: que TODOS los dominios del examen esten sobre el umbral.
- 25% Promedio de simulacros recientes.
- 15% Tendencia: si mejoras o te estancas.
- 15% Constancia: sesiones en los ultimos 14 dias.
- 10% Retencion: que tan reciente fue tu ultima sesion (decae si paras).

Compuerta "LISTO PARA AGENDAR" (deben cumplirse las TRES, para examenes oficiales):
1. Puntaje compuesto >= 75.
2. Ningun dominio por debajo de 60.
3. Al menos 2 simulacros, en dias distintos de los ultimos 14, que superen el
   umbral del examen por su margen (Foundational 60 -> 65; Advanced 65 -> 70).

Por que asi: un solo simulacro alto es un espejismo (mide un banco de preguntas un
dia). Dos o mas simulacros sobre el umbral, en dias distintos, sin dominios flojos,
es el patron que de verdad predice aprobar.

De donde salen los datos (se generan SOLOS al estudiar):
- `evaluacion/resultados/historial.csv`  lo escribe `quiz_runner.py` en cada quiz/simulacro.
- `evaluacion/competencias.json`          lo actualizas tu (o Composer) con EVIDENCIA.
- `evaluacion/blueprints.json`            dominios y pesos de cada certificacion.

Regla de oro de evidencia: solo subes una competencia cuando hay prueba (un quiz
aprobado, un ejercicio validado, un simulacro), nunca por sensacion.

---

## Como registrar un simulacro (para que cuente en la compuerta)

Un "simulacro" es un quiz largo e intercalado, idealmente cronometrado:

    python evaluacion\quiz_runner.py --repaso --n 25

Queda guardado como "repaso intercalado" y `preparacion.py` lo cuenta como
simulacro. Para que se acerque al examen real:
- Hazlo cronometrado (regla: ~1.8 min por pregunta; el examen real son 100
  preguntas en 180 min). Para 25 preguntas, ponte 45 min.
- Sin mirar apuntes (libro cerrado, como el examen).
- Despues, repasa CADA error y registra la correccion (no solo la nota).

A medida que avances en el plan, amplia el banco de preguntas (tu o Composer)
agregando preguntas a los `quiz.json` por dominio, para que los simulacros sean
mas representativos.

---

## Ritmo sostenible

- Dias normales: 30-60 min (1 bloque + repaso espaciado `repaso.py`).
- Dias ocupados: 5-15 min (ver `MICRO-APRENDIZAJE.md`).
- 1 vez por semana: sesion larga (90 min) de practica/proyecto + 1 simulacro.
- 1 vez por semana: corre `preparacion.py` y anota el puntaje en `PROGRESO.md`.

Senal de que APRENDES (no solo estudias): el puntaje compuesto sube semana a
semana y tus tarjetas Leitner migran a las cajas 4-5 (`repaso.py --estado`).

---

# META 1: HL7 FHIR Foundational Implementer (meses 1-6)

Dominios oficiales y su peso (estan en `blueprints.json`):
- Resource Model and Structure (25-33%)
- FHIR API Behavior (19-33%)
- Implementation (19-29%)
- Troubleshooting and Validation (13-19%)
- Understanding Implementation Guides (4-8%)

## Mes 1: profundizar el modelo FHIR R4
Objetivos: recursos clave (Patient, Observation, Encounter, Condition,
MedicationRequest, DiagnosticReport, AllergyIntolerance); tipos de datos
(Identifier, HumanName, Quantity, Period, Reference); cardinalidad y flags.
Practica: crea ejemplos propios de 7 recursos y validalos.
Compuerta del mes (medible): dominio `modelo_recursos` >= 75 en `preparacion.py`.

## Mes 2: API REST avanzada y conformidad
Objetivos: search encadenado (chaining), `_include`/`_revinclude`, modificadores,
paginacion; operaciones `$everything`, `$validate`, `$expand`; CapabilityStatement.
Practica: 10 escenarios de busqueda sobre datos de Synthea.
Compuerta del mes: dominio `api_behavior` >= 75.

## Mes 3: profiles e Implementation Guides
Objetivos: StructureDefinition, profiles, extensions; leer y aplicar US Core o IPS;
elegir el profile correcto para un caso de uso.
Practica: validar un recurso contra US Core y corregir lo que falle.
Compuerta del mes: dominio `guias_implementacion` >= 70 (registralo con evidencia).

## Mes 4: troubleshooting y validacion (modulo nuevo, ver dia 15 sugerido)
Objetivos: `$validate`, leer OperationOutcome, codigos de error del servidor,
aplicar reglas de profile para validar instancias.
Practica: provoca errores a proposito y arreglalos guiandote por OperationOutcome.
Compuerta del mes: dominio `troubleshooting` >= 70.

## Mes 5: integracion y repaso intercalado
Objetivos: unir todo; resolver casos de uso mixtos como en el examen.
Practica: simulacros semanales `--repaso --n 25`, cronometrados.
Compuerta del mes: promedio de simulacros >= 65 y tendencia estable o subiendo.

## Mes 6: ventana de examen
- Corre `python evaluacion\preparacion.py --cert foundational --detalle`.
- Agenda SOLO cuando el semaforo este VERDE (las 3 condiciones cumplidas).
- Registro: cuenta en hl7.org, paga, recibe voucher, agenda en Webassessor.

---

# META 2: Competencia GCP Cloud Healthcare API (meses 4-8, solapado)

No es un examen oficial: es competencia practica medible. Dominios en
`blueprints.json` (gcp_setup, gcp_rest, gcp_validacion, gcp_seguridad, gcp_datos).

Mantente en gratis: capa gratuita de Healthcare API (25,000 req/mes, 1 GiB-hora)
o servidor HAPI local. Borra recursos al terminar (ver dia 14).

Objetivos por bloque:
- Setup y jerarquia: proyecto, dataset, FHIR store R4 (ya cubierto dias 8-9).
- CRUD/REST sobre tu store con token de acceso (dias 9-10, 13).
- Validacion: observa como GCP rechaza datos mal formados; lee OperationOutcome.
- Seguridad: IAM por roles, tokens que caducan, principio de menor privilegio.
- Datos: importar Synthea; (opcional) exportar a BigQuery para analitica.

Proyecto integrador DoctorSV (la prueba de fuego):
- Disena e implementa un caso de uso end-to-end (p.ej. registro y consulta de
  signos vitales con resumen), backend en Python (o Go/NestJS si quieres).
- Conecta tu backend a GCP (o HAPI local) con buenas practicas.

Compuerta "competencia GCP lograda" (medible):
- En `preparacion.py --cert gcp`: competencia practica >= 80 y ningun dominio < 60.
- Evidencia: proyecto funcionando + README que lo explique. Registra cada dominio
  gcp_* en `competencias.json` cuando lo demuestres con el proyecto.

---

# META 3: HL7 FHIR Advanced Developer (meses 9-12)

Requisito formal: haber aprobado el Foundational. Recomendado: ~1 ano de
experiencia FHIR. Dominios (peso ESTIMADO en `blueprints.json`; ajusta con el
HL7 FHIR Advanced Developer Study Guide oficial):
- Profiling y StructureDefinition (slicing, extensions)
- Busqueda avanzada y operaciones
- Seguridad y SMART on FHIR (App Launch + Backend Services)
- Servicios de terminologia (CodeSystem, ValueSet, ConceptMap)
- Conformidad y CapabilityStatement
- Clientes/servidores, Bundles y transacciones

## Mes 9: profiling profundo
Objetivos: crear profiles con slicing y extensions; herramientas (Forge/Sushi).
Practica: define un profile para un caso de DoctorSV y valida instancias contra el.
Compuerta: dominio `profiling` >= 70 con evidencia (un profile validando).

## Mes 10: SMART on FHIR en practica
Objetivos: flujo completo App Launch y Backend Services (JWT firmado, JWKS, scopes
granulares como en US Core).
Practica: ejecuta un flujo real contra el sandbox SMART y/o tu store.
Compuerta: dominio `seguridad_smart` >= 70.

## Mes 11: terminologia, operaciones y conformidad avanzadas
Objetivos: ConceptMap, $expand/$lookup/$validate-code; CapabilityStatement a fondo.
Practica: resolver escenarios de terminologia y operaciones.
Compuerta: dominios `terminologia` y `busqueda_avanzada` >= 70.

## Mes 12: simulacros y ventana de examen
- Simulacros semanales cronometrados centrados en Advanced.
- Corre `python evaluacion\preparacion.py --cert advanced --detalle`.
- Agenda SOLO en VERDE (compuesto >= 75, ningun dominio < 60, 2+ simulacros >= 70).

---

## Modulos nuevos sugeridos para el laboratorio (dias 15-20)

Para cubrir al 100% las metas 1 y 3, conviene agregar (puedo crearlos cuando
quieras, con su quiz y su prompt para Composer):
- Dia 15: `$validate` + OperationOutcome (troubleshooting).
- Dia 16: profiles y StructureDefinition (lectura y validacion).
- Dia 17: SMART on FHIR hands-on (flujo de token real).
- Dia 18: search avanzado (chaining, _include, modificadores).
- Dia 19: terminologia avanzada (ValueSet/CodeSystem/ConceptMap, $expand).
- Dia 20: GCP avanzado (import Synthea, IAM, metricas del store).

Cuando existan, agrega sus numeros de dia a los dominios en `blueprints.json`
para que el calculador de preparacion los tome automaticamente.

---

## Resumen del bucle semanal (imprime esto en tu mente)

1. Estudia el bloque del mes (aprender haciendo).
2. Repaso espaciado casi a diario: `python evaluacion\repaso.py`.
3. 1 simulacro cronometrado por semana: `python evaluacion\quiz_runner.py --repaso --n 25`.
4. Mide: `python evaluacion\preparacion.py` y anota el puntaje en `PROGRESO.md`.
5. Ataca el dominio mas bajo la semana siguiente.
6. Agenda el examen SOLO cuando el semaforo este VERDE.
