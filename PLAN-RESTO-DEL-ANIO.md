# Plan del resto del anio: de los cimientos a la certificacion FHIR

Las 2 semanas te dan los CIMIENTOS. Este plan cubre los meses siguientes para
acumular la experiencia practica que HL7 recomienda (~6 meses) antes del examen
FHIR Foundational Implementer, sin gastar (servidor local o capa gratuita de GCP).

Principios (los mismos, sostenidos en el tiempo):
- Recuperacion activa + repeticion espaciada SIEMPRE (corre `repaso.py` casi a diario).
- Intercalado: mezcla temas en cada repaso (`quiz_runner.py --repaso`).
- Aprender haciendo: cada mes, algo construido, no solo leido.
- Medir: autoevaluacion mensual con porcentaje; apunta en `PROGRESO.md`.

## Ritmo sugerido

- Dias normales: 30-60 min (1 bloque de estudio + repaso espaciado).
- Dias ocupados: 5-15 min de micro-aprendizaje (ver `MICRO-APRENDIZAJE.md`).
- 1 vez por semana: una sesion mas larga (90 min) de practica/proyecto.
- 1 vez por mes: autoevaluacion y ajuste de plan.

## Mes 1: profundizar el modelo FHIR R4

Objetivos:
- Recorrer la especificacion R4 por areas: recursos clave (Patient, Observation,
  Encounter, Condition, MedicationRequest, DiagnosticReport, AllergyIntolerance).
- Tipos de datos FHIR (Identifier, HumanName, Quantity, Period, Reference).
- Cardinalidad y flags de elementos (0..1, 1..*, must-support).
Practica:
- Para 5 recursos, crea ejemplos propios y validalos con $validate en tu servidor.
- Lee OperationOutcome cuando falle una validacion y corrige.
Medible: explicar (Feynman) 7 recursos y crear ejemplos validos de cada uno.

## Mes 2: API REST avanzada y conformidad

Objetivos:
- Busqueda avanzada: encadenado (chaining), _include / _revinclude, modificadores,
  paginacion.
- Operaciones: $everything (Patient), $validate, $expand (terminologia).
- Interpretar CapabilityStatement a fondo.
Practica:
- Consultas complejas sobre datos de Synthea cargados en tu servidor.
Medible: resolver 10 escenarios de busqueda sin ayuda.

## Mes 3: profiles e Implementation Guides

Objetivos:
- StructureDefinition, profiles, extensions.
- Leer y aplicar una IG real: US Core (o International Patient Summary).
- Como elegir el profile correcto para un caso de uso (clave en el examen).
Practica:
- Validar un recurso contra un profile de US Core; corregir lo que falle.
Medible: explicar que es un profile y validar contra US Core con exito.

## Mes 4: seguridad y SMART on FHIR en practica

Objetivos:
- SMART App Launch y SMART Backend Services (JWT firmado, JWKS).
- Scopes detallados; flujo de autorizacion completo.
Practica:
- Probar el sandbox de SMART (bulk-data.smarthealthit.org) y un flujo de token.
Medible: describir paso a paso un flujo SMART Backend Services.

## Mes 5: proyecto integrador realista (DoctorSV)

Objetivos:
- Disenar e implementar un caso de uso end-to-end util para DoctorSV
  (por ejemplo, registro y consulta de signos vitales con su resumen),
  sobre GCP (capa gratuita) o local.
Practica:
- App pequena que crea, busca y muestra datos con buenas practicas.
Medible: proyecto funcionando + README que lo explique.

## Mes 6: preparacion del examen

Objetivos:
- Repasar la guia de competencias del Foundational Implementer y sus pesos:
  - Resource Model and Structure (25-33%)
  - FHIR API Behavior (19-33%)
  - Implementation (19-29%)
  - Troubleshooting and Validation (13-19%)
  - Understanding Implementation Guides (4-8%)
- Simulacros cronometrados (100 preguntas, 3 horas, aprobar 60%).
Practica:
- 2-3 simulacros completos; repasar errores con repeticion espaciada.
Medible: simulacros >= 75% de forma consistente antes de registrarte.

## Registro del examen

- Crea cuenta en hl7.org, registra y paga el examen; te llega un voucher para
  agendar en Webassessor (ver `recursos/enlaces-oficiales.md`).
- Opcion online con webcam o en centro Kryterion.

## Como medir el progreso global

- Cada mes corre `python evaluacion\quiz_runner.py --repaso --n 25` y apunta el %.
- Manten tus tarjetas de Leitner: meta = casi todo en cajas 4-5.
- Si un area baja, dedicale una semana extra antes de avanzar.
