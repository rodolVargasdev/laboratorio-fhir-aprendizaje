# Panorama actual de FHIR (2026)

> **En simple:** antes de meterte al detalle conviene saber en qué punto está el estándar HOY: qué versión se usa y se examina (R4), cómo evoluciona (ballots, FMM, releases), qué certificación existe, qué guías de implementación mandan y qué está cambiando (R6, SMART 2.2, Bulk Data). Este tema te vacuna contra estudiar material desactualizado y te da el mapa estratégico que un director de proyecto necesita.

## Las versiones y cuál importa

| Versión | Número | Año | Estado | Qué significa para ti |
|---------|--------|-----|--------|-----------------------|
| **R4** | **4.0.1** | 2019 | **Normativa (en sus partes clave)** | La que usa la industria y la que evalúa el examen. La API REST, los formatos y los tipos de datos son estables desde aquí. **Si implementas hoy, es R4.** |
| R4B | 4.3.0 | 2022 | Transicional | R4 + retro-adaptaciones puntuales (`SubscriptionTopic`, recursos de evidencia). Adopción escasa; existe para tender puente hacia R5 sin migración completa. |
| R5 | 5.0.0 | 2023 | Trial Use (nada nuevo normativo) | Miles de cambios sobre R4 (Subscriptions topic-based, `CodeableReference`...). Adopción minoritaria; muchos ecosistemas la saltan. |
| **R6** | 6.0.0 | en balota 2026-27 | **Primera balota que busca normatividad amplia** | El evento del bienio: pretende dejar estable la mayoría de los recursos. Aún no la estudies para el examen. |

Reglas prácticas:

- **Examen y producción = R4 (4.0.1).** Ancla tus lecturas a `hl7.org/fhir/R4/`. Cuidado: la raíz `hl7.org/fhir/` sin sufijo sirve la versión "current" (hoy R5), y `build.fhir.org` sirve el borrador diario de R6. Tres URL parecidas, tres versiones distintas.
- **US Core saltará de R4 a R6, omitiendo R5.** Señal fuerte de que R5 quedará como versión de transición histórica.
- R6 se balota como estándar **ANSI normativo**: cuando cierre, las decisiones quedan congeladas por décadas. Por eso el proceso toma años.

### Tabla de decisión: ¿qué versión uso en mi proyecto?

| Situación | Versión recomendada | Razón |
|-----------|--------------------|-------|
| Certificarte (Foundational / Advanced) | R4 | Es la versión del examen |
| Integración nacional o institucional nueva (2026) | R4 | Máximo soporte de plataformas, IGs maduros, tooling probado |
| Debes interoperar con US Core / IPS / Da Vinci | R4 | Todos publican sobre R4 hoy |
| Necesitas Subscriptions modernas sobre R4 | R4 + Subscriptions R5 Backport IG | Trae el modelo topic-based sin migrar de versión |
| Producto greenfield con horizonte 2028+ y sin dependencias | R4 con arquitectura preparada para R6 | R5 es callejón minoritario; planifica el salto R4->R6 |
| Investigación / seguir el estándar | R5 y build de R6 | Para anticipar cambios, no para producción |

## Cómo evoluciona el estándar: ballots, FMM y ciclo de releases

Entender la maquinaria te permite predecir qué será estable y qué cambiará.

### El proceso de ballot

1. Los **Work Groups** de HL7 (dueños de cada recurso) procesan las propuestas de cambio del tracker público.
2. El contenido se publica en el **build continuo** (build.fhir.org) y se prueba en **connectathons**.
3. Se balota formalmente: primero como **STU** (Standard for Trial Use: se esperan cambios con el feedback) y, cuando madura, como **Normative** (norma ANSI: prohibido romper compatibilidad hacia adelante).
4. Cada release mayor (R4, R5, R6) empaqueta años de este ciclo; entre releases hay *technical corrections* (por eso R4 es 4.0.1 y no 4.0.0).

### FMM: madurez artefacto por artefacto

Cada recurso lleva su **FHIR Maturity Model**: 0 (borrador) a 5 (producción probada en 5+ sistemas independientes), más **N** (Normative). En R4, `Patient` y `Observation` son normativos, pero recursos como `AppointmentResponse` o los financieros tienen FMM bajo. Consecuencia de dirección: la pregunta correcta nunca es "¿el servidor es R4?", sino "¿qué FMM tienen los recursos sobre los que apuesto?".

### Ejemplos concretos de evolución (para entender qué se arregla y por qué)

- **Subscriptions:** R4 usa un modelo *criteria-based* (la suscripción lleva un criterio de búsqueda) que resultó ambiguo e inescalable. R5 lo rediseñó a *topic-based*: `SubscriptionTopic` define el disparador y `Subscription` el canal. Como la industria vive en R4, existe el **Subscriptions R5 Backport IG** para usar el modelo nuevo sin salir de R4/R4B. Patrón para memorizar: cuando R5+ arregla algo urgente, la comunidad lo *backportea* a R4 vía IG.
- **EncounterHistory:** en R4, `Encounter` embebe `statusHistory` y `classHistory`, lo que obliga a reescribir el recurso entero en cada cambio de estado (ineficiente y ruidoso en `_history`). R5/R6 extraen esa traza a un recurso propio, `EncounterHistory`. Lección: los recursos evolucionan hacia separar "estado actual" de "traza histórica".
- **CodeableReference (nuevo en R5):** muchos campos clínicos necesitan aceptar "un código O una referencia" (p. ej. una condición como código SNOMED o como referencia a `Condition`). En R4 eso obligaba a dos campos paralelos; R5 lo unifica en un tipo. Lección: el estándar consolida patrones repetidos en tipos reutilizables.

## Certificación vigente (cambió en 2024: verifica tu material)

- El examen de entrada es **HL7 FHIR Foundational Implementer**. **Reemplazó** al antiguo *HL7 FHIR R4 Proficiency*, retirado en **diciembre de 2024**. Si un material dice "R4 Proficiency", está desactualizado.
- Evalúa **R4**: fundamentos del estándar, API REST, recursos, búsqueda, conformidad (perfiles, extensiones), terminología y seguridad a nivel conceptual. Espera **leer tanto JSON como XML**.
- Formato de referencia: alrededor de 100 preguntas de opción múltiple en unos 180 minutos, con umbral de aprobación en torno al 60 %. HL7 ajusta estos parámetros: **confirma en la ficha oficial al inscribirte.**
- **HL7 FHIR Advanced Developer** es el siguiente escalón (perfilado, IGs, operaciones, arquitectura) y **exige tener vigente el Foundational**. Tu ruta: Foundational primero, Advanced después.
- Preparación oficial: los cursos de `courses.hl7.org` y el *practice test*; esta plataforma cubre el temario, los enlaces oficiales son para ahondar.

## Las guías de implementación (IG) que mandan

Los IG son los "dialectos acordados"; la interoperabilidad real vive aquí.

- **US Core** (sobre R4): el IG nacional de EE. UU., alineado con USCDI (el listado regulatorio de datos mínimos). Define perfiles con elementos **must-support** y es el modelo a imitar para cualquier IG nacional. Recuerda: must-support significa "el sistema debe poder manejarlo", **no** "el dato es obligatorio" (obligatorio = cardinalidad mínima 1).
- **IPS, International Patient Summary** (sobre R4): el resumen mínimo del paciente para atención transfronteriza, como Bundle tipo `document` con `Composition`. Es la referencia natural para un **resumen nacional del paciente** en El Salvador: dataset acotado, terminología internacional, estructura de documento.
- **Da Vinci** (EE. UU., pagador-proveedor): familia de IGs para intercambio con aseguradoras: PDex (datos del pagador), CRD/DTR/PAS (autorización previa electrónica). Aunque su regulación es estadounidense, sus patrones (consultas entre organizaciones, decisiones automatizadas) son exportables a cualquier sistema con asegurador público.
- **mCODE**: datos mínimos de oncología (elementos comunes de cáncer para asistencia e investigación). Ejemplo de IG de dominio clínico.
- **SMART Bulk Data Access (Flat FHIR)**: exportación poblacional asíncrona en **NDJSON** (`$export`), autenticada con Backend Services. Es la pieza para analítica, tableros nacionales y pipelines de IA: no consultas paciente por paciente, exportas cohortes completas.

## Seguridad, terminología y plataformas hoy

### SMART App Launch 2.2: el estado del arte

- **Scopes v2** (los v1 tipo `patient/Observation.read` quedan como legado):
  - Verbos granulares **c r u d s** (create, read, update, delete, search), combinables: `patient/Observation.rs` = leer y buscar.
  - **Parámetros embebidos** en el scope: `patient/Observation.rs?category=vital-signs` acota el permiso a un subconjunto de recursos.
  - Contextos: `patient/` (paciente en contexto), `user/` (lo que el usuario puede ver), `system/` (sin usuario).
- **Backend Services** (sistema-a-sistema): grant `client_credentials` donde el cliente se autentica con un **JWT firmado con su clave privada** y el servidor verifica contra su **JWKS** publicado. Scopes `system/...`. Es la base de Bulk Data.
- PKCE es obligatorio en los flujos con usuario. Todo el detalle en el tema de seguridad.

### Terminología

- Recursos: **CodeSystem**, **ValueSet**, **ConceptMap** (+ NamingSystem).
- Operaciones: `$expand` (poblar listas), `$lookup` (metadata de un código), `$validate-code` (pertenencia), `$translate` (mapear entre sistemas).
- Vocabularios: **LOINC** (laboratorio/observaciones), **SNOMED CT** (clínico general), **ICD-10/11** (diagnóstico/estadística), **UCUM** (unidades), **RxNorm** (fármacos, EE. UU.).
- **Binding strengths** (cae en examen): `required` (solo códigos del ValueSet) > `extensible` (úsalo si aplica; si no, otro código) > `preferred` (recomendado) > `example` (ilustrativo).
- Infraestructura pública: **terminology.hl7.org (THO)** publica los sistemas de códigos de HL7; **tx.fhir.org** es el servidor de terminología de referencia (pruebas, no producción).

### Plataformas y qué versión soportan

| Plataforma | Versiones FHIR | Nota |
|-----------|----------------|------|
| HAPI FHIR (open source, Java) | DSTU2 -> R5 | El servidor de referencia comunitario; su instancia pública es tu laboratorio |
| Google Cloud Healthcare API | DSTU2, STU3, R4, R5 | FHIR store gestionado + export a BigQuery |
| Microsoft Azure Health Data Services | R4 | Producción enfocada en R4 |
| Firely Server (.NET) | STU3, R4, R5 | Fuerte en validación y tooling de perfiles |
| Medplum, Aidbox y otros | R4 principalmente | Generación nueva: FHIR como backend de producto |

Consenso 2026: **R4 es el objetivo de producción** en todas partes; el soporte R5 existe pero la demanda es minoritaria.

### Qué está pasando (2024-2026)

- **R6 en balota normativa**: lo estratégicamente relevante del bienio.
- **Bulk Data consolidado** como mecanismo estándar de analítica poblacional y alimentación de modelos de IA (NDJSON como formato de intercambio masivo).
- **US Core anuncia el salto R4->R6** para su línea futura, confirmando a R5 como versión de transición.
- Crecimiento de **IGs nacionales** en América Latina y Europa: el patrón "US Core local" se replica; ahí se ubicaría un IG salvadoreño.

## Errores comunes y gotchas

- **Estudiar en la URL equivocada:** `hl7.org/fhir/` (sin versión) sirve la versión current (R5) y `build.fhir.org` el borrador R6. Para el examen, TODO en `hl7.org/fhir/R4/`.
- **"R4 es normativa" a secas:** solo sus partes clave (API REST, formatos, datatypes, Patient, Observation y recursos de conformidad/terminología). Muchos recursos R4 siguen en Trial Use con FMM bajo.
- **Materiales que citan el "R4 Proficiency":** examen retirado en diciembre de 2024; el vigente es Foundational Implementer.
- **Confundir scopes v1 y v2:** si ves `.read`/`.write` es v1; si ves combinaciones `.cruds` (p. ej. `.rs`) es v2. El examen y SMART 2.2 esperan que reconozcas ambos.
- **`transaction` tratado como best-effort:** el Bundle `transaction` es **atómico** (todo o nada); el `batch` es el best-effort. Clásico de examen.
- **must-support leído como obligatorio:** significa que el sistema debe poder producir/consumir el elemento, no que toda instancia deba traerlo.
- **Ignorar la paginación:** los resultados de búsqueda llegan en páginas; el enlace `next` del `Bundle.link` es opaco y hay que seguirlo, no construir URLs propias.
- **Asumir que "el IG va incluido en el servidor":** un servidor R4 genérico no valida US Core ni IPS por defecto; los perfiles se cargan y exigen configuración.

## Nivel experto

- **Por qué R5 quedó varada:** salió en 2023 sin contenido normativo nuevo, con miles de cambios que obligaban a re-perfilar todos los IGs. Los reguladores (que citan versiones concretas en reglas legales) no tenían incentivo para migrar dos veces. Resultado: la industria decidió esperar a R6 normativa. Moraleja estratégica: en estándares de salud, **la regulación y los IGs arrastran la adopción, no la novedad técnica**.
- **El costo real de un salto de versión:** migrar R4->R6 no es cambiar un número: es re-perfilar los IGs, regenerar el tooling, migrar datos persistidos (los FHIR stores guardan la versión con la que se escribió) y re-certificar integraciones. Por eso los saltos se planifican con años y por eso "preparado para R6" significa hoy aislar tu lógica de negocio del modelo FHIR con una capa de mapeo.
- **Backports como estrategia:** el Subscriptions R5 Backport IG demuestra el mecanismo maduro del ecosistema para adelantar futuro sin romper presente. Si diriges una plataforma nacional, vigila qué backports existen antes de inventar soluciones propias para las carencias de R4.
- **La trampa de la equivalencia entre plataformas:** "soporta R4" no dice cuánta búsqueda, qué operaciones (`$everything`, `$export`), qué validación de perfiles ni qué comportamiento de transaction implementa cada servidor. Dos servidores R4 conformes pueden diferir enormemente: el CapabilityStatement es el contrato real, no el número de versión.
- **must-support es contextual al IG:** cada IG define QUÉ significa must-support para sus sistemas (p. ej. US Core distingue obligaciones de servidor y de cliente). Al escribir un IG nacional, definir esa semántica explícitamente es de las decisiones más importantes y más olvidadas.
- **Bulk Data cambia la arquitectura de datos nacional:** con `$export` + NDJSON + Backend Services, el ministerio no necesita consultas en línea contra cada hospital para estadística: exporta cohortes a su lago de datos. Separar el plano transaccional (REST síncrono) del analítico (bulk asíncrono) es la decisión de arquitectura que evita colapsar los servidores clínicos.

## Chuleta

| Concepto | Dato clave |
|----------|-----------|
| Versión de examen y producción | R4 (4.0.1), en `hl7.org/fhir/R4/` |
| R4B / R5 | Transicional (2022) / Trial Use minoritaria (2023) |
| R6 | En balota normativa 2026-27; US Core salta R4->R6 omitiendo R5 |
| Ballot | STU (cambios esperados) -> Normative (ANSI, sin rupturas) |
| FMM | 0-5 + N; madurez por artefacto, no por versión |
| Certificación | Foundational Implementer (desde dic-2024; sucede al R4 Proficiency); Advanced Developer exige el Foundational |
| US Core | IG nacional de EE. UU.; must-support ≠ obligatorio |
| IPS | Resumen del paciente transfronterizo; Bundle document + Composition |
| Da Vinci / mCODE | Pagador-proveedor / oncología |
| Bulk Data | `$export` asíncrono, NDJSON, Backend Services |
| Scopes v2 | `contexto/Recurso.cruds` (+ parámetros: `?category=...`) |
| Subscriptions | R4 criteria-based; R5 topic-based; Backport IG para R4 |
| Evolución R5 | `CodeableReference`, `EncounterHistory` |
| Terminología | `$expand`, `$lookup`, `$validate-code`, `$translate`; bindings required > extensible > preferred > example |

## Autoevaluacion

1. ¿Qué versión evalúa el examen y por qué la industria no migró a R5?
2. ¿Qué diferencia hay entre las URL `hl7.org/fhir/R4/`, `hl7.org/fhir/` y `build.fhir.org`?
3. ¿Cómo se llama la certificación de entrada vigente, a cuál reemplazó y qué exige el Advanced Developer?
4. Explica el modelo de Subscriptions de R4, el de R5, y cómo usar el moderno sin salir de R4.
5. Escribe un scope SMART v2 que permita leer y buscar observaciones de laboratorio del paciente en contexto, acotado por categoría.
6. ¿Qué significa must-support en un IG como US Core y en qué se diferencia de la cardinalidad 1..?
7. ¿Qué mecanismo usarías para alimentar el tablero analítico nacional sin consultar paciente por paciente?
8. Ordena las binding strengths de más a menos estricta y di qué implica `extensible`.

### Respuestas

1. R4 (4.0.1). R5 salió como Trial Use sin contenido normativo nuevo y obligaba a re-perfilar todos los IGs; reguladores y vendors decidieron esperar la balota normativa de R6. La regulación y los IGs arrastran la adopción, no la novedad.
2. `hl7.org/fhir/R4/` es la publicación congelada de R4 (tu ancla); `hl7.org/fhir/` sirve la versión current publicada (hoy R5); `build.fhir.org` es el borrador diario del build continuo (camino a R6).
3. HL7 FHIR Foundational Implementer, que reemplazó al R4 Proficiency (retirado en diciembre de 2024). El HL7 FHIR Advanced Developer exige tener vigente el Foundational.
4. R4: criteria-based (la Subscription lleva un criterio de búsqueda). R5: topic-based (SubscriptionTopic define el disparador; Subscription, el canal). Para usar el modelo topic-based sobre R4/R4B existe el Subscriptions R5 Backport IG.
5. `patient/Observation.rs?category=laboratory` (r = read, s = search; el parámetro embebido acota la categoría).
6. Must-support: el sistema debe ser capaz de producir/consumir el elemento según las reglas del IG; no obliga a que cada instancia lo traiga. Obligatorio es cardinalidad mínima 1 en el perfil. Cada IG define la semántica exacta de must-support.
7. SMART Bulk Data Access: operación `$export` asíncrona con salida NDJSON, autenticada con Backend Services (scopes `system/`), hacia el lago de datos analítico.
8. required > extensible > preferred > example. `extensible`: si algún código del ValueSet aplica al concepto, debes usarlo; solo si ninguno aplica puedes usar otro código.

## Para profundizar

- [Especificación FHIR R4 (raíz)](http://hl7.org/fhir/R4/) — tu ancla permanente de estudio; todo lo del examen vive bajo esta URL.
- [Build continuo](https://build.fhir.org/) — el borrador de R6 en vivo; útil para ver hacia dónde va cada recurso (no para estudiar el examen).
- [US Core](https://hl7.org/fhir/us/core/) — el IG nacional de referencia mundial; estudia cómo define perfiles y must-support.
- [International Patient Summary](https://www.hl7.org/fhir/uv/ips/) — el modelo natural para un resumen nacional del paciente.
- [SMART App Launch](http://hl7.org/fhir/smart-app-launch/) — scopes v2, contextos y Backend Services de primera fuente.
- [terminology.hl7.org](https://terminology.hl7.org/) — THO: los sistemas de códigos y ValueSets que HL7 publica fuera del core.
- [Registro de IGs y paquetes](https://registry.fhir.org/) — explora qué IGs existen antes de inventar perfiles propios.
- [Certificación HL7 FHIR](https://www.hl7.org/certification/fhir.cfm) — la ficha oficial: requisitos, inscripción y políticas vigentes del Foundational y el Advanced.
