# Panorama actual de FHIR (2026)

> **En simple:** antes de meterte al detalle, conviene saber en que punto esta el
> estandar HOY: que version se usa, que se certifica, que guias mandan y hacia donde
> va. Esto te ahorra estudiar cosas desactualizadas y te da contexto de experto.

## Las versiones y cual importa

| Version | Ano | Estado | Que significa para ti |
|---------|-----|--------|-----------------------|
| **R4 (4.0.1)** | 2019 | **Normativa** (partes) | La que usa la industria y la que evalua el examen. La API REST y los tipos de datos son estables desde aqui. **Si implementas hoy, es R4.** |
| R4B (4.3.0) | 2022 | Transicional | R4 + backport de `SubscriptionTopic`. Poco adoptada. |
| R5 (5.0.0) | 2023 | Trial Use (nada normativo) | +4000 cambios sobre R4; adopcion minoritaria. Muchos la saltan. |
| **R6 (6.0.0)** | 2026-27 (en balota) | **Primera balota normativa completa** | El horizonte: busca dejar la mayoria de recursos estables. En transicion; aun no la estudies para el examen. |

Reglas practicas:

- **Examen y produccion = R4.** Ancla tus lecturas a `hl7.org/fhir/R4/` (la raiz sin
  version ya sirve **R5** por defecto; no te confundas).
- **US Core saltara de R4 a R6, omitiendo R5.** La v10 (R6 + USCDI v7) se proyecta ~2027.
- R6 se balota como estandar **ANSI normativo**: es el evento grande del bienio.

### Cambios entre versiones que un implementador debe conocer

- **Subscriptions:** R4 = modelo *criteria-based*; R5 lo rediseña a *topic-based*
  (`SubscriptionTopic` define el disparador; `Subscription` el canal). Hay un
  **Subscriptions R5 Backport IG** para usar el modelo nuevo sobre R4/R4B.
- **Encounter:** R4 embebia `statusHistory`/`classHistory` (ineficiente); R5/R6 crean el
  recurso `EncounterHistory`.
- **`CodeableReference`** (nuevo en R5): combina un codigo o una referencia en un solo campo.

## Certificacion vigente (importante: cambio en 2024)

- El examen actual es **HL7 FHIR Foundational Implementer**. **Reemplazo** al antiguo
  *HL7 FHIR R4 Proficiency*, que se **retiro en diciembre de 2024**.
- Evalua **R4**. Recomiendan saber **leer JSON y XML** (aparecen en el examen).
- Preparacion oficial: curso en `courses.hl7.org` (asincrono, con tutor, cinco modulos)
  y un *practice test*.
- HL7 no publica abiertamente numero de preguntas / duracion / nota de corte: **verifica
  en la ficha de inscripcion**.

> **Gotcha de examen:** si un material dice "R4 Proficiency", esta desactualizado.

## Guias de implementacion (IG) que mandan

Los IG son "dialectos acordados". La interoperabilidad real vive aqui, no solo en FHIR core.

- **US Core v9.0.0 (STU9)** sobre R4, alineado con **USCDI v6** (USCDI v7 en draft).
  Define perfiles y *must-support* para EE.UU.
- **International Patient Summary (IPS) v2.0.0** sobre R4: dataset minimo para atencion
  transfronteriza. Muy relevante para una **integracion nacional**.
- **Da Vinci** (pagador-proveedor): PDex, prior authorization (CRD/DTR/PAS).
- **SMART Bulk Data Access 2.0**: exportacion poblacional asincrona (NDJSON).
- **mCODE**: oncologia.

## Seguridad hoy: SMART App Launch 2.2.0

- **Scopes v2** (reemplazan a los v1 tipo `patient/Observation.read`):
  - Verbos granulares: `.c` create, `.r` read, `.u` update, `.d` delete, `.s` search.
    Se combinan: **`patient/Observation.rs`** = leer + buscar.
  - **Parametros embebidos en el scope**:
    `patient/Observation.rs?category=vital-signs` limita el acceso a un subconjunto.
  - Contextos: `patient/`, `user/`, `system/`.
- **SMART Backend Services** (sistema-a-sistema): `client_credentials` con **JWT firmado**
  y scopes `system/` (p. ej. `system/Observation.rs`). Es la base de Bulk Data.

> **Gotcha:** confundir scopes v1 y v2 es error clasico. Si ves `.rs`, es v2.

## Terminologia (ciudadana de primera clase)

- Recursos: **CodeSystem, ValueSet, ConceptMap** (+ NamingSystem).
- Operaciones: **`$expand`** (poblar listas), **`$lookup`** (metadata de un codigo),
  **`$validate-code`** (pertenencia + display correcto), **`$translate`** (mapear sistemas).
- Vocabularios: **LOINC** (labs/observaciones), **SNOMED CT** (clinico), **ICD-10/11**
  (diagnostico/facturacion), **UCUM** (unidades).
- Servidor publico de referencia: **tx.fhir.org** (pruebas, no produccion pesada).
- **Binding strengths** (cae en examen): `required` > `extensible` > `preferred` > `example`.

## Plataformas y que version soportan

| Plataforma | Versiones FHIR |
|-----------|----------------|
| **HAPI FHIR** (open source, servidor de pruebas publico) | DSTU2 → **R5** |
| **Google Cloud Healthcare API** | DSTU2, STU3, R4, **R5** |
| **Firely Server** | STU3, R4, R5 en paralelo |
| **Microsoft Azure Health Data Services** | **R4** (produccion) |

Consenso 2025-2026: **R4 es el objetivo de produccion**; R5 esta disponible pero es
minoritario.

## Que hay de nuevo (2024-2026)

- **R6 en balota normativa** (lo mas relevante estrategicamente).
- **Bulk Data 2.0** consolidado (Cures Act, analitica poblacional, pipelines de IA).
- **FHIR como capa de datos para IA** (NDJSON para entrenamiento/analitica).
- USCDI v7 en draft (30 elementos nuevos).

## Errores comunes (gotchas) que separan al experto

- Asumir que un `Bundle` de tipo **`transaction` es "best-effort"**: es **atomico**
  (todo o nada). El `batch` si es best-effort.
- Tratar **`must-support` como obligatorio**: no lo es (obligatorio = cardinalidad `1..`).
- Olvidar **`_include:iterate`** para incluir referencias en cadena.
- Mezclar **`code`/`Coding`** con **`CodeableConcept`**.
- No manejar la **paginacion opaca** del `Bundle.link` (`next`).
- Estudiar R5/R6 para un examen que evalua **R4**.

## Autoevaluacion (sin mirar arriba)

1. .Que version usan hoy el examen y la produccion, y por que?
2. .Como se llama el examen actual y a cual reemplazo?
3. Escribe un scope SMART v2 que permita leer y buscar observaciones de un paciente.
4. .Que diferencia hay entre un Bundle `transaction` y uno `batch`?
5. .Que operacion de terminologia usarias para poblar un desplegable clinico?

### Respuestas

1. **R4** (4.0.1): la API REST y los tipos son normativos/estables desde R4 y es el objetivo regulatorio y de las plataformas.
2. **HL7 FHIR Foundational Implementer**; reemplazo al **R4 Proficiency** (retirado en dic. 2024).
3. `patient/Observation.rs` (r = read, s = search).
4. `transaction` es atomico (todo o nada, resuelve referencias internas); `batch` ejecuta cada entrada de forma independiente (best-effort).
5. `$expand` sobre un ValueSet.
