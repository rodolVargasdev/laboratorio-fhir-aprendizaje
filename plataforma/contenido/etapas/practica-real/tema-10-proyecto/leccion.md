# Tema 10 · Proyecto integrador y examen

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Diseñar un mini-proyecto que integra JSON, REST/CRUD, referencias, terminologías y el modelo FHIR.
- Construir mentalmente el flujo de un "resumen clínico": crear datos, leerlos de vuelta y presentarlos.
- Medir tu preparación con criterios objetivos (examen acumulado, cajas de Leitner, checklist).
- Saber qué evalúa el examen HL7 Foundational Implementer y cómo encaja en tu ruta de 3 metas.
- Usar los simulacros y el repaso espaciado como termómetro, no como trámite.

## Lectura

### Por qué un proyecto integrador

Saber piezas sueltas (qué es un Patient, cómo hacer un GET) no es lo mismo que resolver un problema real. El mini-proyecto del laboratorio te obliga a encadenar todo: un script que **crea** un paciente ficticio, le **agrega** varias Observation y una Condition enlazadas por referencia, **lee de vuelta** del servidor y arma un **resumen clínico legible**. Es pequeño, pero contiene la anatomía de cualquier integración FHIR real.

### El caso de uso de integración nacional

Imagina la consulta externa: llega un paciente nuevo. El sistema debe registrarlo, capturar sus signos vitales y su diagnóstico, y al final la enfermera quiere una hoja resumen. En FHIR eso es:

1. **POST Patient** — el registro demográfico. El servidor responde `201 Created` y asigna un `id`. Guárdalo: todo lo demás cuelga de él.
2. **POST Observation** (una por signo vital: frecuencia cardíaca, temperatura...) con `subject.reference = "Patient/{id}"` y un código LOINC en `code`. Sin el `subject`, la observación queda huérfana; sin código estándar, nadie más entiende qué mediste.
3. **POST Condition** (el diagnóstico) también referenciando al paciente, idealmente con código SNOMED CT o ICD-10.
4. **Leer de vuelta**: `GET Patient/{id}` y `GET Observation?subject=Patient/{id}`. Leer del servidor (no de tus variables locales) verifica que los datos realmente quedaron bien guardados y enlazados.
5. **Presentar**: recorrer el Bundle de resultados (`entry[].resource`) y formatear un texto legible, incluyendo la edad calculada desde `birthDate`.

Errores comunes que el proyecto saca a la luz: no revisar códigos de estado HTTP (asumir que todo POST funcionó), olvidar el prefijo de tipo en la referencia (`"123"` en vez de `"Patient/123"`), y armar el resumen desde memoria local en lugar de leer del servidor.

Este mismo esqueleto, con SMART para autenticación y un FHIR store de GCP como backend, es literalmente una integración de producción en miniatura.

### Higiene de cierre: la limpieza en la nube

Si practicaste con la vía GCP, el cierre del proyecto incluye borrar el dataset (`gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1`). Integrar también significa operar con disciplina de costos: el proyecto no termina cuando el script corre, sino cuando el entorno queda en $0.

### Medirte de forma objetiva

La sensación de "creo que ya sé" es traicionera. El laboratorio usa criterios medibles:

- **Examen final acumulado** (`quiz_runner.py --repaso --n 20` y `--dia 14`): mezcla preguntas de todos los temas. La meta es **≥ 80%**. Intercalar temas es más difícil que repasar por bloques, y por eso predice mejor la retención real.
- **Cajas de Leitner**: el repaso espaciado (`repaso.py`) mueve cada tarjeta a una caja superior cuando la aciertas. La meta es que la mayoría esté en **cajas 3-5** (las de intervalos largos). Tarjetas estancadas en cajas 1-2 marcan exactamente qué reforzar.
- **Checklist de fundamentos**: los puntos del checklist básico más terminologías, modelo FHIR, Bundle y un mini-proyecto funcionando.

Si cumples los tres, tienes **cimientos**. No es el final: es la base sobre la que va la especificación a profundidad.

### El examen HL7 Foundational Implementer

Tu ruta tiene 3 metas en orden: **1) Foundational Implementer** (entrada, ACTIVO — ojo: el antiguo "FHIR R4 Proficiency" está en pausa, la meta vigente es el Foundational), **2)** competencia práctica en GCP Cloud Healthcare API (no es examen de HL7, es tu laboratorio), **3) Advanced Developer**, que exige haber aprobado el Foundational.

El Foundational evalúa que entiendas los fundamentos del estándar FHIR R4 como implementador: la estructura de recursos y tipos de datos, la API REST (interacciones, códigos de estado), búsqueda, Bundles, terminologías (CodeSystem/ValueSet, LOINC, SNOMED CT), referencias entre recursos, y las bases de conformidad (CapabilityStatement, profiles a nivel introductorio). Es decir: exactamente lo que el mini-proyecto ejercita, pero preguntado en frío.

HL7 recomienda llegar al examen con **experiencia práctica acumulada**, no solo lectura. Por eso el plan del resto del año (`guias/PLAN-RESTO-DEL-ANIO.md`) prioriza seguir construyendo, con micro-aprendizaje para los días ocupados.

### Cómo usar los simulacros

Un simulacro sirve si lo tratas como diagnóstico:

1. Hazlo **sin mirar apuntes** y a tiempo continuo, como el examen real.
2. Registra el resultado (el historial queda en `evaluacion/resultados/historial.csv`) y observa la tendencia entre intentos, no un número aislado.
3. Por cada fallo, escribe por qué era correcta la respuesta correcta — el error es el mejor material de estudio.
4. Cierra con Feynman: si puedes dar una "clase" de 10 líneas sobre qué es FHIR, cómo se consulta y por qué importa, a un compañero nuevo de la integración nacional, lo dominas. Si te trabas, ahí está tu hueco.

## Chuleta

| Elemento | Referencia rápida |
|---|---|
| Flujo del proyecto | POST Patient → POST Observation/Condition (con `subject`) → GET de vuelta → resumen |
| Enlace de recursos | `"subject": { "reference": "Patient/{id}" }` |
| Consulta por paciente | `GET {base}/Observation?subject=Patient/{id}` |
| Códigos de éxito | 200 OK (lectura/update), 201 Created (creación) |
| Edad del paciente | calcular desde `Patient.birthDate` |
| Limpieza GCP | `gcloud healthcare datasets delete integracion-nacional-dataset --location=us-central1` |
| Meta examen final | ≥ 80% en el acumulado mezclado |
| Meta Leitner | mayoría de tarjetas en cajas 3-5 |
| Simulacro acumulado | `python evaluacion\quiz_runner.py --repaso --n 20` |
| Estado del repaso | `python evaluacion\repaso.py --estado` |
| Ruta de certificación | Foundational Implementer → práctica GCP → Advanced Developer |

## Autoevaluación (sin mirar arriba)

1. Enumera los 5 pasos del mini-proyecto de resumen clínico y qué interacción REST usa cada uno.
2. ¿Por qué el resumen debe armarse leyendo de vuelta del servidor y no desde las variables locales del script?
3. ¿Cuáles son los 3 criterios objetivos de éxito de los cimientos y sus umbrales?
4. ¿Qué áreas evalúa el examen Foundational Implementer y qué lugar ocupa en tu ruta de 3 metas?
5. Describe cómo convertir un simulacro fallado en material de estudio útil.

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 10 Proyecto".
2. Añade estos enlaces oficiales como fuentes:
  - https://hl7.org/certification/fhir.cfm — página oficial de certificación FHIR de HL7, tu meta.
  - https://www.hl7.org/training/fhir-exam.cfm — detalles del examen Foundational Implementer.
  - https://www.hl7.org/training/fhir-foundational-prep.cfm — curso oficial de preparación del Foundational.
  - http://hl7.org/fhir/R4/http.html — la API REST que el proyecto integra de punta a punta.
  - http://hl7.org/fhir/R4/resourcelist.html — lista de recursos R4 para ubicar Patient, Observation y Condition.
3. Prompts sugeridos:
  - "Actúa como entrevistador técnico: hazme defender el diseño del mini-proyecto de resumen clínico paso a paso, cuestionando cada decisión (referencias, códigos, lecturas de verificación)."
  - "Genera un simulacro de 15 preguntas estilo Foundational Implementer mezclando REST, referencias, terminologías y Bundles, y corrígeme citando las fuentes."
  - "A partir de las fuentes, arma un plan de repaso de 4 semanas previo al examen Foundational, asumiendo 30 minutos diarios."

---

### Respuestas

1. (1) POST Patient → 201 con id; (2) POST Observation por cada signo vital con `subject.reference`; (3) POST Condition referenciando al paciente; (4) GET Patient/{id} y GET Observation?subject=Patient/{id} para leer de vuelta; (5) recorrer las entries del Bundle y formatear el resumen legible.
2. Porque leer del servidor verifica el estado real: que los recursos se crearon, que las referencias quedaron bien y que las búsquedas los encuentran. Las variables locales pueden "verse bien" aunque el servidor haya rechazado o guardado mal algo.
3. Examen final acumulado ≥ 80%; mayoría de tarjetas de Leitner en cajas 3-5; checklist completo de fundamentos (incluyendo terminologías, modelo FHIR, Bundle y un mini-proyecto funcionando).
4. Fundamentos de FHIR R4 como implementador: recursos y tipos de datos, API REST y códigos de estado, búsqueda, Bundles, terminologías, referencias y bases de conformidad. Es la meta 1 (entrada) de la ruta; le siguen la competencia práctica en GCP y el Advanced Developer (que requiere el Foundational aprobado).
5. Hacerlo sin apuntes y a tiempo continuo, registrar el resultado y comparar la tendencia en el historial, escribir por cada fallo la justificación de la respuesta correcta, y cerrar explicando el tema en voz propia (Feynman) para detectar huecos.
