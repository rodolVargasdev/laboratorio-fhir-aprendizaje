# Practica

## Objetivo

Auditar un `RiskAssessment` real del orquestador de prevención, medir sus hallazgos
contra el estándar, refactorizarlo a FHIR idiomático, escribir el perfil y los
CodeSystems que impidan la regresión, y demostrar con dos `OperationOutcome` que la
versión nueva es validable y la vieja no.

## Preparacion

- Entorno del curso activo (Python, `curl`; ver [Setup](/setup)).
- Servidor HAPI público para validar sin costo: `https://hapi.fhir.org/baseR4`.
- Recomendado: Node.js con SUSHI (`npm install -g fsh-sushi`) para el ejercicio 4.
- Opcional: el validador oficial (`validator_cli.jar`) para el reto 2.
- Crea `institucion/tema-11/` y guarda ahí todo lo que produzcas.

**Regla de datos:** trabajas con la copia anonimizada de abajo (UUIDs regenerados,
valores de laboratorio perturbados). No subas a HAPI público, ni a NotebookLM, ni a
ningún servicio externo un recurso con datos reales de paciente.

## El recurso auditado

Guárdalo como `institucion/tema-11/original.json`:

```json
{
  "resourceType": "RiskAssessment",
  "id": "3f7b1a25-9c04-4e6d-8a31-b52d7c0e9f18",
  "meta": {
    "lastUpdated": "2026-08-04T17:40:16.049369+00:00",
    "versionId": "MTc4NTg2NTIxNjA0OTM2OTAwMA"
  },
  "identifier": [
    { "system": "http://goes.gob.sv/fhir/prevention-program", "value": "preliminary" }
  ],
  "basis": [ { "reference": "RiskAssessment/1d9e4c88-2a76-41b3-9f05-6c8ad3427e10" } ],
  "method": {
    "coding": [
      {
        "code": "secondary",
        "display": "Prevencion Secundaria",
        "system": "http://goes.gob.sv/fhir/codeable-concept/prevention-assessment"
      }
    ],
    "extension": [
      {
        "url": "http://goes.gob.sv/fhir/extensions/prevention-assessment/context",
        "extension": [
          {
            "url": "activeProblem",
            "extension": [
              { "url": "code", "valueCode": "5C80.0Z" },
              { "url": "status", "valueCode": "confirmed" },
              { "url": "conditionDisplay", "valueCode": "Hipercolesterolemia, sin especificacion" },
              {
                "url": "conditionReference",
                "valueReference": { "reference": "Condition/7c5a0b93-4d18-42ef-b6a9-0e3f18d75c24" }
              }
            ]
          }
        ]
      }
    ]
  },
  "occurrenceDateTime": "2026-08-04T11:40:15-06:00",
  "prediction": [
    {
      "extension": [
        {
          "url": "http://goes.gob.sv/fhir/extensions/prevention-phase/type",
          "extension": [ { "url": "phaseType", "valueCode": "preliminary" } ]
        }
      ],
      "outcome": {
        "coding": [
          {
            "code": "phase_2_dis",
            "display": "phase_2_dis",
            "system": "http://goes.gob.sv/fhir/codeable-concept/prevention-phase/phase"
          },
          {
            "code": "proposed",
            "display": "Fase Propuesta por la Ejecucion Preliminar del Orquestador",
            "system": "http://goes.gob.sv/fhir/codeable-concept/prevention-phase/status"
          }
        ]
      },
      "rationale": "{\"engine_context\": {\"rules_yaml\": \"prevention_phase_config_dis.yaml\", \"version\": \"base\", \"matched_rule_ids\": [\"dis_lipidos_transitional\", \"dis_transitional_pa\", \"dis_transitional_glycemia\"], \"phase_candidates\": [\"phase_2_dis\", \"phase_2_dis\", \"phase_2_dis\"], \"observations_snapshot\": {\"pa_mmHg\": {\"pa_s\": 118.0, \"pa_d\": 74.0}, \"fpg_mg_dl\": 111.0, \"colesterol_total_mg_dl\": 226.0, \"trigliceridos_mg_dl\": 132.0, \"hdl_mg_dl\": 38.0, \"ldl_mg_dl\": 162.0, \"carga_aterogenica_mg_dl\": 188.0, \"imc\": 29.4}, \"appointments\": [{\"specialty\": \"metabolico\", \"codeTCA\": \"METAB\", \"display\": \"Medico Metabolico\", \"schedule_rule\": {\"t_value\": 4, \"t_unit\": \"meses\"}}], \"studies\": [{\"code\": \"colesterol_total\", \"codeTCA\": 101115}, {\"code\": \"hdl\", \"codeTCA\": 101117}, {\"code\": \"ldl\", \"codeTCA\": 101118}, {\"code\": \"trigliceridos\", \"codeTCA\": 101116}], \"physical_assessments\": [{\"code\": \"pa\", \"codeTCA\": 10150104}], \"routing\": {\"priority_mode\": \"dis\", \"active_condition\": \"dis\"}}}"
    },
    {
      "outcome": {
        "coding": [
          {
            "code": "-1",
            "display": "Nivel dentro de la fase de prevencion",
            "system": "http://goes.gob.sv/fhir/codeable-concept/prevention-phase/degree"
          }
        ]
      },
      "rationale": "{\"engine_context\": {\"rules_yaml\": \"prevention_phase_config_dis.yaml\", \"version\": \"base\"}}"
    }
  ],
  "status": "final",
  "subject": { "reference": "Patient/e41b6d70-8f39-4a52-9c1d-2b7e508a63f4" }
}
```

## Ejercicios guiados

1. **Validación base y la trampa del "válido".** Valida el recurso contra el core:

   ```bash
   curl -sS -X POST "https://hapi.fhir.org/baseR4/RiskAssessment/$validate" \
     -H "Content-Type: application/fhir+json" -d @original.json
   ```

   Salida esperada: `OperationOutcome` **sin issues de severidad `error`**. Guárdalo
   como `01-validate-original.json`. Verifica que puedes responder en una frase: si el
   recurso es válido, ¿por qué tiene siete hallazgos? (La respuesta es el tema
   completo: validez sintáctica no es interoperabilidad.)

2. **Tabla de hallazgos con severidad.** Recorre el JSON con el método de la sección 5
   de la lección y produce `02-hallazgos.md` con columnas: hallazgo, elemento afectado
   (ruta FHIRPath, ej. `RiskAssessment.identifier[0].value`), regla del estándar
   violada con su enlace, severidad (bloqueante / mayor / menor), y corrección
   propuesta. Mínimo siete filas. Verifica: cada fila cita una URL de hl7.org, no una
   opinión.

3. **Refactor a FHIR idiomático.** Escribe `refactor.py` que lea `original.json` y
   emita un Bundle `transaction` (`03-refactor.json`) con:

   - Seis `Observation` con LOINC real: colesterol total `2093-3`, HDL `2085-9`,
     LDL calculado `13457-7`, triglicéridos `2571-8`, glucosa en ayunas `1558-6`,
     IMC `39156-5`. Cada una con `valueQuantity` (unidad UCUM: `mg/dL`, `kg/m2`),
     `status: final`, `subject` y `effectiveDateTime` = el `occurrenceDateTime`.
   - Una `Observation` de presión arterial con `code` `85354-9` y dos `component`:
     sistólica `8480-6` (118 mm[Hg]) y diastólica `8462-4` (74 mm[Hg]).
   - El `RiskAssessment` reconstruido según el esquema de la sección 4 de la lección:
     `status: preliminary`, `code` y `method` separados, `condition` apuntando a la
     Condition, `basis` a las Observation por `urn:uuid:`, `basedOn` a la ejecución
     anterior, `performer` a un `Device` del orquestador, un solo `prediction` cuyo
     `outcome` lleve **una** coding, y `rationale` en texto humano.

   Envíalo:

   ```bash
   curl -sS -X POST "https://hapi.fhir.org/baseR4" \
     -H "Content-Type: application/fhir+json" -d @03-refactor.json
   ```

   Salida esperada: `transaction-response` con `201 Created` en cada entry. Verifica
   recuperando la evaluación con `?_include=RiskAssessment:basis` y comprobando que las
   observaciones vienen en el Bundle. Verifica también que ahora funciona lo que antes
   era imposible: `Observation?code=2093-3&value-quantity=gt200`.

4. **El perfil y los catálogos en FSH.** Crea `prevencion.fsh` con:

   - `CodeSystem: PrevencionFaseCS` (códigos de fase, con `display` humanos de verdad),
     `PrevencionEstadoFaseCS` (`proposed`, `confirmed`, `discarded`) y
     `PrevencionTipoCS` (`primary`, `secondary`, `tertiary`), cada uno con su `ValueSet`.
   - `Extension: FaseEstadoPrevencion` y `Extension: GradoPrevencion` (simples, con
     `context` = RiskAssessment).
   - `Profile: RiskAssessmentPrevencionSV` sobre `RiskAssessment`: `code 1..1 MS` con
     binding `required` al ValueSet de tipo, `condition 1..1 MS`, `performer 1..1 MS`,
     `basis 1..* MS`, `identifier 1..1 MS`, y `prediction.outcome` con binding
     `required` al ValueSet de fase.

   Compila con `sushi .`. Verifica: cero errores y puedes explicar por qué cada
   cardinalidad que cerraste responde a un requisito nacional, no a un gusto.

5. **La prueba de fuego: vieja vs nueva contra el perfil.** Añade
   `meta.profile: ["http://goes.gob.sv/fhir/StructureDefinition/riskassessment-prevencion-sv"]`
   a ambas versiones y valida las dos contra tu StructureDefinition (HAPI con el
   parámetro `profile`, o el validador oficial del reto 2). Guarda
   `05-validate-comparado.md` con los dos OperationOutcome y una lectura línea por
   línea. Verifica: el original falla **exactamente** en los hallazgos que predijiste en
   el ejercicio 2, y el refactor pasa limpio. Si falla algo que no predijiste, tu
   auditoría estaba incompleta: corrígela.

## Limpieza

En HAPI público no hay nada que borrar (es efímero y compartido), pero **nunca dejes
ahí nada que se parezca a un dato real**: si en algún momento cargaste el recurso sin
anonimizar, bórralo de inmediato y regenera los identificadores. Elimina de tu máquina
cualquier export del store de producción que hayas usado para comparar.

## Retos

1. **Provenance del motor**: modela la ejecución con un `Provenance` que registre agente
   (el `Device` del orquestador), `occurredDateTime` y la versión del YAML de reglas.
   Éxito: puedes responder "¿qué versión del motor produjo esta evaluación?" con una
   sola búsqueda FHIR.
2. **Validador oficial**: valida ambas versiones con `java -jar validator_cli.jar -ig .`
   contra tu IG compilado. Éxito: los resultados coinciden con los de HAPI y explicas
   cualquier diferencia.
3. **ConceptMap del catálogo interno**: mapea los `codeTCA` del blob (`101115`,
   `101117`, `101118`, `101116`, `10150104`) a LOINC en un `ConceptMap` nacional.
   Éxito: el ConceptMap valida y queda como insumo real para el equipo del orquestador.
4. **PlanDefinition**: expresa **una** de las reglas del YAML como `PlanDefinition` con
   su condición en FHIRPath. Éxito: puedes argumentar con ese ejemplo en la mano qué
   ganaría el orquestador al publicar sus reglas como recurso ejecutable y qué costaría.
5. **La conversación difícil**: escribe el correo de una página que le mandarías al
   equipo del orquestador. Éxito: prioriza por costo de migración, reconoce lo que el
   diseño actual resolvió bien y no usa la palabra "mal" ni una vez.

## Reto Feynman

Explícale a un jefe no técnico por qué un recurso que "pasa la validación" puede seguir
siendo un problema serio. Usa una sola analogía, sin siglas: nada de FHIR, JSON,
esquema ni API. Tienes 90 segundos y debes cerrar con qué pedirías que se corrija
primero y por qué eso y no otra cosa.

## Criterio de completado

- [ ] `01-validate-original.json` guardado y explicado (válido, pero con hallazgos).
- [ ] `02-hallazgos.md` con siete filas mínimo, cada una con ruta FHIRPath, regla y severidad.
- [ ] `refactor.py` corriendo y `03-refactor.json` aceptado como transaction en HAPI.
- [ ] Búsqueda por `Observation?code=2093-3&value-quantity=gt200` devolviendo la medición que antes era invisible.
- [ ] `prevencion.fsh` compilado con SUSHI sin errores (perfil + 3 CodeSystems + 2 extensiones).
- [ ] `05-validate-comparado.md` demostrando que el original falla donde predijiste y el refactor pasa.
- [ ] Al menos 3 retos completados, incluido el 5.
