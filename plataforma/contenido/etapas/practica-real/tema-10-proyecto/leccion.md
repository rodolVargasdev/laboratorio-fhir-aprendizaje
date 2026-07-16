# Proyecto integrador: interoperabilidad FHIR para una red nacional de salud

> **En simple:** este tema no enseña una pieza nueva: te obliga a ensamblar TODAS las anteriores en un diseño defendible. Vas a jugar el rol que tendrás en la vida real —arquitecto de interoperabilidad de una institución nacional— y a producir entregables concretos: una arquitectura, un perfil de paciente con identificador nacional, una matriz de permisos, un piloto en la nube y una propuesta ejecutiva. De paso, queda trazado el plan exacto hacia tus tres metas: Foundational Implementer, competencia GCP y Advanced Developer.

## Arquitectura de referencia de la red nacional

El problema real de El Salvador (y de casi cualquier país): decenas de sistemas asistenciales que no se hablan —HIS hospitalarios, expedientes de primer nivel, laboratorios con HL7 v2, vacunación en hojas de cálculo— y una necesidad urgente de vista longitudinal del paciente y de vigilancia epidemiológica. La arquitectura de referencia que integra todo lo aprendido:

```
FUENTES LEGACY                CAPA DE INTEGRACIÓN            NÚCLEO                    CONSUMIDORES
─────────────                 ────────────────────           ──────                    ────────────
HIS (HL7 v2 ADT/ORU)  ──►  Motor de integración        ┌─────────────────┐      Apps SMART (clínicos,
LIS (v2 / CSV)        ──►  - parseo v2 -> FHIR R4  ──►  │ Servidor FHIR   │ ◄──  pacientes) App Launch
Vacunación (CSV)      ──►  - mapeo terminológico       │ nacional (R4)   │
Farmacia (API propia) ──►  - $validate en la puerta    │ + tx server     │ ──►  Bulk Data $export ->
                            - cola de rechazos          │ + IG nacional  │      BigQuery / reportes
                                                        └─────────────────┘      epidemiológicos, BI
```

Principios de diseño que debes poder defender:

- **FHIR R4 como lengua franca del núcleo**, no necesariamente de las puntas: los sistemas legados siguen emitiendo v2/CSV; la capa de integración traduce. Nadie "migra a FHIR" de golpe; se converge.
- **Validación en la puerta**: nada entra al servidor nacional sin pasar `$validate` contra los perfiles nacionales. Un dato malo compartido es peor que un dato ausente.
- **Separación identidad/autorización/recursos**: authorization server (SMART), servidor FHIR y servidor de terminología son responsabilidades distintas aunque al inicio vivan juntos.
- **Todo consumo es un cliente SMART**: humanos por App Launch, sistemas por Backend Services. Cero credenciales compartidas, cero endpoints anónimos.

## Decisiones fundacionales: versión, servidor y gobernanza

### Versión: R4, con los ojos en R6

R4 es la decisión correcta y la debes saber argumentar: es la versión con contenido normativo (Patient, Observation, la API REST), donde viven los IGs maduros (US Core, IPS, SMART, Bulk Data), la que cubren las certificaciones HL7 y la que soportan todos los servidores relevantes. R5 existe pero su ecosistema de IGs es delgado; R6 está en proceso de balota normativa. Estrategia experta: núcleo R4 + gobernanza de perfiles disciplinada = migración futura barata, porque el costo de migrar vive en los perfiles y mapeos, no en el CRUD.

### Servidor: tabla de decisión

| Criterio | HAPI FHIR (autogestionado) | GCP Cloud Healthcare API | Azure Health Data Services |
|---|---|---|---|
| Costo inicial | $0 licencia; pagas operación | Pago por uso, capa gratuita | Pago por uso |
| Operación (parches, escalado, HA) | Tu equipo, 24/7 | Google | Microsoft |
| Personalización (interceptores, operaciones custom, $validate contra IG propio) | Máxima | Limitada al producto | Limitada al producto |
| Soberanía de datos | Total (on-premise posible) | Regiones GCP; contratos | Regiones Azure; contratos |
| Analítica integrada | La construyes | Export nativo a BigQuery | Synapse/Fabric |
| Ecosistema local de talento | Java/Spring | La institución ya es GCP-first | Depende |
| Riesgo de dependencia (lock-in) | Bajo | Medio (mitigable: es FHIR estándar + export NDJSON) | Medio |

Decisión razonable para el piloto nacional: **GCP para el núcleo** (operación mínima, BigQuery para epidemiología, IAM/auditoría maduros) + **HAPI local para desarrollo y validación** (ahí corres el validador contra tu IG y experimentas gratis). El lock-in se mitiga porque todo lo que entra y sale es FHIR R4 + NDJSON: la salida de emergencia siempre existe.

### Gobernanza

Un comité técnico de interoperabilidad (institución rectora + hospitales + laboratorio nacional) que sea dueño de: los perfiles, los catálogos terminológicos, el registro de sistemas cliente (con sus scopes) y el calendario de versiones del IG nacional. Sin gobernanza, los perfiles se pudren en seis meses.

## Perfiles y terminología nacionales

### El proceso de perfilado (no reinventar)

1. **Adoptar, no inventar**: partir del core R4 y de patrones probados (US Core como referencia metodológica, IPS para resúmenes). Se copia el proceso, no el contenido estadounidense.
2. **Perfilar lo mínimo**: cada restricción debe responder a un requisito nacional real.
3. **Publicar como IG**: perfiles en FSH compilados con SUSHI y publicados con IG Publisher, con canonical propio (`https://fhir.salud.gob.sv/...`).

### PacienteNacional: el perfil ancla

El identificador nacional (DUI) se modela como `identifier` con un `system` propio y estable — esa URI es una decisión de gobernanza de por vida:

```
Profile: PacienteNacional
Parent: Patient
Id: paciente-nacional
Title: "Paciente Nacional (El Salvador)"
Description: "Paciente para el intercambio en la red nacional de salud."
* identifier 1..* MS
* identifier ^slicing.discriminator.type = #value
* identifier ^slicing.discriminator.path = "system"
* identifier ^slicing.rules = #open
* identifier contains dui 0..1 MS
* identifier[dui].system = "https://fhir.salud.gob.sv/identificadores/dui" (exactly)
* identifier[dui].value 1..1
* name 1..* MS
* gender 1..1 MS
* birthDate 1..1 MS
```

Decisiones incrustadas ahí que debes saber justificar: el DUI es `0..1` (recién nacidos y extranjeros no tienen DUI: el slicing abierto permite otros identificadores), `identifier` global es `1..*` (algo debe identificar a la persona), y los `MS` (must support) obligan a los sistemas a no descartar esos campos. Una instancia conforme:

```json
{
  "resourceType": "Patient",
  "meta": {"profile": ["https://fhir.salud.gob.sv/StructureDefinition/paciente-nacional"]},
  "identifier": [{"system": "https://fhir.salud.gob.sv/identificadores/dui", "value": "04567890-1"}],
  "name": [{"family": "Ramírez", "given": ["Ana"]}],
  "gender": "female",
  "birthDate": "1988-04-12"
}
```

### Terminología: servidor y mapeos

- **Códigos internacionales donde existan**: LOINC para laboratorio y signos vitales, SNOMED CT para problemas y procedimientos (verificar la situación de licencia del país), completados con CIE-10 donde el flujo administrativo lo exige.
- **ValueSets nacionales** para lo local (establecimientos de salud, regiones sanitarias, programas), publicados en el IG con canonicals propios.
- **ConceptMap + `$translate`** para el legado: el catálogo interno de exámenes del laboratorio nacional se mapea a LOINC una vez, y la capa de integración traduce en vuelo. Los mapeos son entregables versionados, no scripts ocultos.
- Un **servidor de terminología institucional** (el propio HAPI, Snowstorm u Ontoserver) responde `$validate-code`, `$expand` y `$translate` para toda la red; los enlaces canónicos se resuelven contra registry.fhir.org y terminology.hl7.org.

## Seguridad, calidad e IPS

### Seguridad entre instituciones

Cada sistema conectado es un cliente **SMART Backend Services**: registro formal, JWKS propio, scopes `system/` de mínimo privilegio (el laboratorio: `system/Observation.c system/DiagnosticReport.c`; epidemiología: `system/*.rs` acotado por cohortes). Los humanos entran por **App Launch** con scopes `user/` o `patient/`. El consentimiento se modela con **Consent**, y la trazabilidad con dos recursos que no son opcionales en un sistema público: **Provenance** (quién originó/transformó cada recurso — vital cuando la capa de integración reescribe datos v2) y **AuditEvent** (quién consultó qué y cuándo), complementados por los Data Access logs de la plataforma.

### Calidad: validación en la puerta y en el CI

Doble barrera:

1. **Runtime**: la capa de integración ejecuta `$validate?profile=...` (o valida con el validador embebido) antes de escribir; los rechazos van a una cola de reproceso con su OperationOutcome, jamás al piso.
2. **CI**: el IG nacional se compila (SUSHI -> IG Publisher) y los ejemplos se validan con el validator oficial de HL7 en cada commit; suites tipo Inferno sirven de modelo para probar conformidad de servidores y clientes que pidan conectarse.

### IPS: el resumen nacional del paciente

El International Patient Summary (IPS) es un IG de HL7 que define un `Bundle` tipo `document` con Composition y secciones mínimas (alergias, medicación, problemas). Adoptarlo como formato del "resumen nacional del paciente" te da: contenido clínico mínimo consensuado internacionalmente, compatibilidad transfronteriza futura, y un objetivo concreto y acotado para la primera fase del proyecto (generar el IPS de cualquier paciente con `Patient/$summary` o composición propia).

## Los 10 entregables y el plan de certificación

### Entregables del proyecto integrador

1. **Diagnóstico de interoperabilidad**: inventario de sistemas, formatos, volúmenes y brechas de la institución.
2. **Perfil PacienteNacional** en FSH con el DUI como identifier slice y su justificación.
3. **Matriz de scopes SMART**: cada sistema/rol de la red con su scope mínimo y su flujo (App Launch vs Backend Services).
4. **Consulta externa modelada**: un encuentro ambulatorio completo como Bundle (Patient, Encounter, Condition, Observation, MedicationRequest) conforme a perfiles.
5. **Cinco búsquedas operativas** documentadas (URL exacta + para qué pregunta de negocio responde cada una).
6. **Catálogo terminológico**: ValueSets nacionales + ConceptMap del catálogo de laboratorio a LOINC.
7. **Validación demostrada**: instancias válidas e inválidas contra PacienteNacional con sus OperationOutcome comentados.
8. **Piloto GCP**: dataset + FHIR store R4 con datos Synthea, export a BigQuery y una consulta epidemiológica, con limpieza a $0 documentada.
9. **Flujo Backend Services funcionando**: script del tema 9 adaptado, con su registro, JWKS y evidencia del manifiesto de export.
10. **Propuesta ejecutiva** (5-8 páginas): arquitectura, fases, riesgos, costos y quick wins, dirigida a la dirección de la institución.

### Las tres metas, en orden

**Meta 1 — HL7 FHIR Foundational Implementer.** Examen de entrada de la ruta de certificación HL7 (del orden de 100 preguntas en unas 3 horas, umbral de aprobación cercano al 60%; confirma las condiciones vigentes en el sitio de HL7 al inscribirte). Cubre fundamentos: recursos, tipos de datos, API REST, búsqueda, Bundles, conformidad básica. Tu criterio de listo: **simulacros en dos días distintos con al menos 65%**, sin ayuda, cronometrados. Los temas 0-7 de este curso son el temario; los quizzes acumulados son tu banco de simulacro.

**Meta 2 — Competencia práctica en GCP Healthcare API.** No hay examen: hay checklist demostrable (temas 8 y este proyecto): montar store R4 con banderas justificadas, CRUD autenticado, import NDJSON, export BigQuery + SQL, IAM mínimo, auditoría y limpieza a $0. El entregable 8 es tu evidencia.

**Meta 3 — HL7 FHIR Advanced Developer.** Exige haber aprobado el Foundational; umbral de aprobación algo mayor (~65%). Temario estimado y qué estudiar extra sobre este curso: **profiling y extensiones (~25%)** — slicing avanzado, invariantes FHIRPath, differential vs snapshot: escribe más FSH; **búsqueda avanzada (~20%)** — chaining, `_revinclude`, modifiers, paginación: practica contra HAPI; **SMART/seguridad (~20%)** — este tema 9 te deja cerca; **terminología (~15%)** — operaciones de CodeSystem/ValueSet/ConceptMap; **conformance (~10%)** — CapabilityStatement, ImplementationGuide; **clientes y Bundles (~10%)** — transacciones, referencias condicionales, manejo de errores.

**Mantenerse al día**: el chat Zulip de la comunidad (chat.fhir.org), los ciclos de balota de HL7 (rumbo a R6), los connectathons (se puede participar remoto) y las release notes de los IGs que adoptes. Treinta minutos semanales bastan para no quedar obsoleto.

## Errores comunes y gotchas

- **Empezar por la tecnología y no por el diagnóstico**: comprar/montar el servidor antes de inventariar sistemas, volúmenes y catálogos existentes. El entregable 1 va primero por algo.
- **Perfilar de más**: 40 restricciones "por si acaso" que ningún sistema puede cumplir. Cada restricción sin requisito real es deuda de gobernanza.
- **DUI como `Patient.id`**: el `id` lógico es del servidor; el identificador de negocio va en `identifier` con su `system`. Confundirlos rompe upserts, merges y federación.
- **URIs canónicas improvisadas**: cambiar el `system` del DUI o el canonical del IG a los seis meses invalida todo lo emitido. Se decide una vez, con dominio institucional, y se congela.
- **Mapeos terminológicos en código**: diccionarios Python enterrados en la capa de integración en vez de ConceptMaps versionados y publicados. Ilegible, inauditable, impublicable.
- **Ignorar el "camino del rechazo"**: diseñar solo el flujo feliz. ¿Qué pasa con el mensaje v2 que no valida? Cola de rechazos, OperationOutcome, dueño y proceso de corrección, o los datos malos entrarán por la ventana.
- **Credenciales compartidas "mientras tanto"**: el api-key provisional entre instituciones se vuelve permanente. Backend Services desde el día uno.
- **Preparar el Advanced antes de aprobar el Foundational**: es prerrequisito formal y el orden pedagógico correcto.
- **Piloto GCP sin disciplina de costos**: un store olvidado con datos de Synthea cobra almacenamiento en silencio. La limpieza es parte del entregable, no una nota al pie.

## Nivel experto

- **Identidad maestra de pacientes (MPI)**: con múltiples fuentes habrá duplicados. FHIR aporta `Patient.link` (replaced-by/replaces) y la operación `$match` para deduplicación probabilística; el MPI es un proyecto en sí mismo dentro de la red nacional.
- **Federación vs centralización**: la alternativa al repositorio central es un modelo federado (cada institución expone su servidor FHIR y un directorio nacional enruta). Trade-offs: latencia y disponibilidad vs soberanía local y costo de sincronización. La respuesta madura suele ser híbrida: índice central + documentos federados.
- **Versionado del IG nacional**: SemVer sobre el IG (1.0.0 -> 1.1.0 aditivo, 2.0.0 con rupturas), periodo de doble soporte y ventanas de migración anunciadas. Los clientes declaran contra qué versión validan vía `meta.profile`.
- **Subscriptions y eventos**: para flujos casi en tiempo real (alertas epidemiológicas), combina las notificaciones Pub/Sub del store (tema 8) o el framework de Subscriptions con topics (madurado después de R4; en R4 se usa el Subscription básico o el backport del IG correspondiente).
- **SLOs de interoperabilidad**: define métricas de producto: % de mensajes válidos a la primera, latencia origen->disponibilidad nacional, cobertura de mapeo terminológico, % de sistemas con scopes mínimos. Lo que no se mide, no se gobierna.
- **Prepararse para R6**: mantener los perfiles delgados, las extensiones documentadas y los mapeos externos al código hace que el salto de versión sea un proyecto de semanas, no de años. Sigue la balota normativa de R6 para anticipar cambios en los recursos que perfilaste.

## Chuleta

| Decisión / pieza | Respuesta corta |
|---|---|
| Versión del núcleo | R4 (normativo, IGs maduros, certificaciones); monitorear R6 |
| Patrón de arquitectura | Legacy v2/CSV -> capa de integración (mapeo + $validate) -> servidor FHIR nacional -> SMART apps / Bulk / BI |
| Servidor del piloto | GCP Healthcare API (operación y BigQuery) + HAPI local (desarrollo/validación) |
| DUI en FHIR | `Patient.identifier` con `system` canónico propio; jamás como `Patient.id` |
| Herramientas de perfilado | FSH + SUSHI -> IG Publisher; validación con el validator oficial en CI |
| Terminología | LOINC/SNOMED/CIE-10 + ValueSets nacionales + ConceptMap con `$translate` |
| Seguridad entre sistemas | SMART Backend Services (JWT RS384 + JWKS), scopes `system/` mínimos |
| Trazabilidad | Provenance (origen/transformación) + AuditEvent (accesos) + Data Access logs |
| Resumen del paciente | IPS (Bundle document con Composition y secciones mínimas) |
| Foundational: listo cuando | Simulacros ≥65% en 2+ días distintos, cronometrados |
| Advanced: pesos estimados | Profiling 25 · Búsqueda 20 · SMART 20 · Terminología 15 · Conformance 10 · Clientes/Bundles 10 |
| Comunidad | chat.fhir.org (Zulip), connectathons, balotas y release notes |

## Autoevaluacion

1. Dibuja (o describe) la arquitectura de referencia de la red nacional y justifica dónde ocurre la validación y dónde el mapeo terminológico.
2. Defiende R4 frente a "usemos R5/R6 que son más nuevos" ante un comité técnico, en cuatro argumentos.
3. ¿Por qué el DUI va en `identifier` con `system` propio y no en `Patient.id`? ¿Qué se rompe si se hace al revés?
4. Diseña la matriz de scopes para: laboratorio nacional que publica resultados, app de médicos de consulta externa, y proceso de epidemiología que exporta cohortes.
5. Explica la doble barrera de calidad (runtime + CI) y qué herramienta concreta actúa en cada una.
6. ¿Qué aporta el IPS como formato del resumen nacional frente a inventar un Bundle propio?
7. Enumera de memoria al menos 8 de los 10 entregables del proyecto.
8. ¿Cuál es tu criterio numérico y temporal para agendar el examen Foundational, y por qué el Advanced debe esperar?

### Respuestas

1. Fuentes legacy (v2/CSV) -> capa de integración, donde ocurren el mapeo (v2->R4 + ConceptMap a LOINC/SNOMED) y la validación en la puerta (`$validate` contra perfiles nacionales, rechazos a cola con OperationOutcome) -> servidor FHIR nacional R4 con terminología e IG -> consumidores: apps SMART (App Launch), procesos Backend Services/Bulk Data y analítica (BigQuery/BI).
2. (a) R4 tiene el contenido normativo estable; (b) el ecosistema de IGs y herramientas (US Core, IPS, SMART, Bulk, validadores) vive en R4; (c) las certificaciones HL7 evalúan R4; (d) todos los servidores relevantes lo soportan, y una gobernanza limpia de perfiles hace barata la migración futura (R6 aún en balota).
3. `Patient.id` es el identificador lógico asignado y gobernado por cada servidor; el DUI es un identificador de negocio nacional. En `identifier` con `system` canónico permite búsqueda estándar (`Patient?identifier=system|valor`), coexistencia de múltiples identificadores y federación. Usarlo como `id` rompe la portabilidad entre servidores, los upserts y el manejo de quienes no tienen DUI.
4. Laboratorio: Backend Services con `system/Observation.c system/DiagnosticReport.c` (crear sin leer). Médicos: App Launch con `user/Patient.rs user/Observation.rs user/Condition.rs` (+`openid fhirUser`). Epidemiología: Backend Services con `system/Patient.rs system/Observation.rs` y export por `Group/[cohorte]/$export`.
5. Runtime: la capa de integración valida cada recurso antes de escribir ($validate/validador embebido) y encola rechazos. CI: SUSHI + IG Publisher compilan el IG y el validator oficial de HL7 valida los ejemplos en cada commit; Inferno modela las pruebas de conformidad de quienes se conectan.
6. Contenido clínico mínimo consensuado internacionalmente (alergias, medicación, problemas), estructura document estándar (Composition + secciones), compatibilidad transfronteriza y no pagar el costo de diseñar/mantener un formato propio sin comunidad.
7. Diagnóstico; perfil PacienteNacional; matriz de scopes; consulta externa modelada; 5 búsquedas operativas; catálogo terminológico (ValueSets + ConceptMap); validación demostrada con OperationOutcome; piloto GCP con BigQuery y limpieza; flujo Backend Services con evidencia; propuesta ejecutiva.
8. Foundational: simulacros cronometrados con ≥65% en al menos dos días distintos (margen sobre el umbral real cercano al 60%). El Advanced espera porque aprobarlo exige el Foundational como prerrequisito y su temario (profiling, búsqueda avanzada, terminología) se construye sobre esa base.

## Para profundizar

- Programa de certificación FHIR de HL7 (requisitos y formatos vigentes): https://www.hl7.org/certification/fhir.cfm
- Cursos oficiales de HL7: https://courses.hl7.org/
- US Core (metodología de perfilado nacional de referencia): https://hl7.org/fhir/us/core/
- International Patient Summary: https://www.hl7.org/fhir/uv/ips/
- Registro de IGs y paquetes FHIR: https://registry.fhir.org/
- Terminología de HL7: https://terminology.hl7.org/
- Especificación FHIR R4: http://hl7.org/fhir/R4/
