# Por qué existe FHIR: de HL7 v2 a los recursos web

> **En simple:** durante 30 años la salud intercambió datos con mensajes de texto crípticos (HL7 v2) y luego con documentos XML gigantes (v3/CDA). Ninguno resolvió el problema completo. En 2011, Grahame Grieve propuso modelar la salud como recursos web consultables por HTTP, igual que cualquier API moderna. Eso es FHIR, y entender de dónde viene te explica cada decisión de diseño que vas a estudiar el resto del curso.

## Interoperabilidad: el problema que define todo

Interoperabilidad en salud significa que dos sistemas distintos (hospital, laboratorio, aseguradora, ministerio) intercambien datos clínicos y el receptor los use **sin reinterpretación manual**. El experto distingue sus niveles:

- **Interoperabilidad sintáctica**: los sistemas comparten el **formato** del mensaje. El receptor puede parsearlo sin romperse. HL7 v2 la logró razonablemente.
- **Interoperabilidad semántica**: el receptor entiende el **significado** de cada dato. Que "glucosa en ayunas" del hospital A sea exactamente el mismo concepto en el sistema B, con la misma unidad y el mismo código. Esto exige terminologías compartidas (LOINC, SNOMED CT) y modelos de información comunes. Aquí fracasaron casi todos los intentos previos a FHIR, y aquí es donde FHIR tampoco es magia: da las herramientas (CodeSystem, ValueSet, perfiles), pero la semántica hay que gobernarla.

Hay quien añade la interoperabilidad **organizacional** (procesos, consentimientos, marcos legales) y la **fundacional** (que el bit llegue de A a B). Para dirigir un proyecto nacional necesitas las cuatro; para el examen, domina la distinción sintáctica/semántica.

## Los antecesores: HL7 v2 y v3/CDA

### HL7 v2: el estándar que ganó la calle

**Health Level Seven (HL7)** se fundó en 1987; el "Level Seven" alude a la capa 7 (aplicación) del modelo OSI. Su **Versión 2**, publicada desde 1988-1989 y evolucionada hasta hoy (v2.9), sigue siendo el estándar de mensajería clínica más desplegado del planeta: se estima que más del 90 % de los hospitales de EE. UU. lo usan en alguna interfaz.

### Anatomía de un mensaje v2

Un mensaje v2 es texto plano en **segmentos** (una línea cada uno) divididos en **campos**: `|` separa campos, `^` componentes, `~` repeticiones, `\` es escape y `&` subcomponentes.

```
MSH|^~\&|SIS_HOSPITAL|HOSP01|LAB_CENTRAL|LAB01|20260715083000||ADT^A01|MSG00001|P|2.5
PID|1||12345^^^HOSP01^MR||Perez^Juan^Antonio||19850315|M|||Col. Escalon^^San Salvador
PV1|1|I|3N^301^A
```

- **MSH** (Message Header) abre todo mensaje: emisor, receptor, fecha, y en MSH-9 el **tipo de evento** (`ADT^A01` = admisión de paciente; ORU^R01 = resultado de laboratorio; ORM = orden).
- **PID** (Patient Identification): PID-3 lleva identificadores, PID-5 el nombre (`apellido^nombre`), PID-7 fecha de nacimiento, PID-8 sexo.
- El receptor responde con un **ACK** (acknowledgement): `AA` (aceptado), `AE` (error de aplicación) o `AR` (rechazado). La fiabilidad del intercambio depende de esta coreografía de mensajes y acuses.

### Por qué triunfó y por qué dolía

Triunfó porque era barato y cubría los flujos reales (admisiones, resultados, órdenes). Dolía por tres males crónicos:

1. **Opcionalidad extrema**: el estándar deja tantos campos opcionales que el mismo dato puede viajar en lugares distintos según el hospital.
2. **Variantes locales**: v2 permite **segmentos Z** (personalizados, como ZPI o ZOR) para lo que el estándar no cubre. Resultado: cada sitio habla un dialecto. El dicho de la industria es literal: "si has visto una interfaz HL7 v2, has visto UNA interfaz HL7 v2". Conectar dos hospitales es siempre un proyecto de mapeo a medida.
3. **Es un evento, no un estado consultable**: un ADT^A01 pasa por un canal (motor de interfaces tipo Mirth/Rhapsody) y desaparece. No existe "GET del paciente 12345". Si llegaste tarde al mensaje, reconstruyes el estado a mano.

Analogía: v2 son **telegramas clínicos**. Rápidos, ubicuos, pero cada operador tiene su jerga y no hay ventanilla donde consultar nada después.

### HL7 v3 y el RIM: el rigor que no escaló

En los años noventa HL7 decidió arreglar el caos de raíz: la **Versión 3** (desarrollada desde ~1995, publicada en los 2000) se construyó sobre el **RIM** (Reference Information Model), un modelo semántico formal con un puñado de clases fundamentales — **Act, Entity, Role**, unidas por Participation, ActRelationship y RoleLink — del que se derivaba por refinamiento cualquier contenido clínico. Todo serializado en XML, con metodología de desarrollo propia (MDF/HDF). El RIM llegó a ser norma ISO (ISO/HL7 21731).

En papel, impecable. En la práctica fracasó fuera de nichos:

- **Curva de aprendizaje brutal**: para mandar un resultado de laboratorio había que entender un modelo de abstracción filosófica (¿un diagnóstico es un Act en mood "event"?).
- **Implementaciones caras y lentas**: proyectos de años donde v2 tomaba semanas.
- **Artefactos enormes**: mensajes XML profundamente anidados, difíciles de generar y de consumir.

### CDA: el sobreviviente del naufragio

Del ecosistema v3 sobrevivió una pieza: **CDA** (Clinical Document Architecture, R2 en 2005), que empaqueta **documentos clínicos** en XML derivado del RIM: nota de alta, resumen de consulta, epicrisis. Un documento CDA tiene identidad legal, firma, contexto y persistencia: exactamente lo que un documento clínico necesita.

En EE. UU., **C-CDA** (Consolidated CDA) fue exigido por los programas regulatorios (Meaningful Use) y por eso sigue vivo en producción masiva. Su límite es estructural: es un **documento monolítico**. Extraer "solo la hemoglobina del último análisis" de un C-CDA exige parsear todo el documento y navegar plantillas. Persiste porque los documentos legales importan y porque la regulación lo cimentó, no porque sea buena API de datos.

Analogía: v3 fue **construir el edificio entero antes de abrir una sola tienda**. Correcto en plano; inviable en la calle.

## 2011: nace FHIR, pensado para la web

Hacia 2011 HL7 reconoció el problema (creó una "Fresh Look Task Force") y un australiano que conocía v2 y v3 por dentro, **Grahame Grieve**, publicó en agosto de 2011 en su blog **Health Intersections** la propuesta **"Resources For Health"** (RFH): abandonar los mensajes y documentos monolíticos y modelar la salud como **recursos** web al estilo de las API de internet. HL7 la adoptó y la renombró **FHIR: Fast Healthcare Interoperability Resources** (pronunciado "fire" a propósito).

### Los principios de diseño (recítalos)

- **Recursos granulares e identificables**: Patient, Observation, Encounter, MedicationRequest... cada uno con `resourceType`, `id`, contenido estructurado, metadatos (`meta`) e historial de versiones. Piensas en estado consultable (`GET /Patient/123`), no en eventos que pasan.
- **API REST sobre HTTP**: los mismos verbos que usa toda la web (GET, POST, PUT, DELETE).
- **Formatos familiares**: JSON y XML como formatos oficiales (R4 añade Turtle/RDF como tercer formato, minoritario).
- **La regla 80/20**: el núcleo de cada recurso incluye solo los elementos que usa aproximadamente el 80 % de los sistemas del mundo. El 20 % restante — lo local, lo raro, lo nacional — va en **extensiones** con URL definida y en **perfiles** (StructureDefinition). Esta decisión evitó dos extremos: el recurso-monstruo de v3 y los segmentos Z anárquicos de v2, porque la extensión es visible, declarada y validable.
- **Barato de implementar**: un desarrollador con curl consume FHIR en horas. La especificación está llena de ejemplos ejecutables.
- **Coexistencia, no big-bang**: FHIR asumió desde el día uno un mundo híbrido con mapeos v2 a FHIR y CDA a FHIR durante décadas.
- **Especificación abierta y gratuita** (licencia Creative Commons), con proceso comunitario.
- **Lo que funciona se prueba**: nada avanza de madurez sin implementaciones reales en **connectathons**.

## De DSTU1 a R4: la línea de tiempo y la ola Argonaut

FHIR maduró por ciclos de borrador con uso real. Qué aportó cada release:

| Versión | Número | Año | Qué aportó |
|---------|--------|-----|------------|
| DSTU1 | 0.0.82 | feb 2014 | Primer borrador formal (Draft Standard for Trial Use). Probó que el enfoque REST+recursos funcionaba. |
| DSTU2 | 1.0.2 | oct 2015 | Base de los pilotos masivos y del proyecto Argonaut; muchos EHR de EE. UU. aún exponen DSTU2. |
| STU3 | 3.0.x | mar 2017 | Renombró Conformance a **CapabilityStatement**, consolidó **FHIRPath**, maduró terminología y perfiles. Amplia adopción industrial. |
| **R4** | **4.0.1** | dic 2018 (4.0.0), corrección 4.0.1 en oct 2019 | **Primer contenido normativo**: la API REST, los formatos JSON/XML, los tipos de datos y recursos pilares (Patient, Observation, StructureDefinition, ValueSet, CodeSystem, CapabilityStatement, OperationDefinition). Tu versión de examen y de producción. |
| R4B | 4.3.0 | may 2022 | Puente transicional: R4 + retro-adaptaciones puntuales (p. ej. SubscriptionTopic, recursos de evidencia). Adopción escasa. |
| R5 | 5.0.0 | mar 2023 | Gran evolución (Subscriptions topic-based, CodeableReference...), todo en Trial Use. Adopción minoritaria. |
| R6 | 6.0.0 | en balota 2026-27 | Primera balota que busca dejar normativa la mayoría del estándar. |

### Argonaut: el punto de inflexión comercial

El **Proyecto Argonaut** (anunciado en diciembre de 2014) juntó a HL7 con los grandes vendors de EHR (Epic, Cerner, athenahealth, MEDITECH) y centros académicos para acordar, sobre DSTU2, perfiles concretos de los datos ambulatorios básicos (paciente, alergias, medicación, problemas, resultados) y una capa de autorización común. Por primera vez, EHR **competidores** exponían **las mismas API**. El IG de Argonaut es el ancestro directo de **US Core**. Sin Argonaut, FHIR habría sido otro estándar bonito; con Argonaut, se volvió contrato ejecutable entre vendors y desarrolladores, y la regulación de EE. UU. (21st Century Cures Act, reglas ONC) lo convirtió después en obligación legal.

### SMART on FHIR: la capa de apps

**SMART** (Substitutable Medical Applications, Reusable Technologies) nació antes que FHIR, en Boston Children's Hospital / Harvard (Josh Mandel, Ken Mandl, ~2010) con financiamiento de la ONC. Su idea: que las apps clínicas fueran **sustituibles**, como en una tienda de apps. Al adoptar FHIR como modelo de datos y OAuth 2.0 + OpenID Connect como seguridad, se convirtió en **SMART on FHIR**: el mecanismo estándar por el que una app de terceros se lanza desde el EHR, pide scopes (`patient/Observation.rs`) y consume recursos. Es tu Tema 3 completo.

## Gobernanza: HL7, ballots, madurez FMM y los IG como dialectos

FHIR no es de ninguna empresa. **HL7 International** (organización acreditada por ANSI) lo mantiene con un proceso que debes conocer porque explica qué tan estable es cada pieza:

### Work Groups y ballots

- Los **Work Groups** (grupos temáticos: Patient Administration, Orders and Observations, FHIR Infrastructure...) son dueños de recursos concretos y procesan los cambios, que cualquiera puede proponer como *change request* en el tracker (Jira de HL7).
- Los **ballots** son votaciones formales: un artefacto se balota como **STU** (Standard for Trial Use, se esperan cambios con feedback) y, cuando madura, como **Normative** (norma ANSI: compatibilidad garantizada hacia adelante; los cambios que rompen quedan prohibidos salvo proceso excepcional).
- Todo se publica gratis en hl7.org/fhir; el trabajo diario vive en Confluence y en chat.fhir.org (Zulip).

### FMM: el termómetro de madurez

Cada recurso y artefacto lleva un **FMM** (FHIR Maturity Model), de 0 a 5, más el estado Normative (a veces descrito informalmente como nivel 6):

| Nivel | Significado práctico |
|-------|----------------------|
| FMM 0 | Borrador: el equipo lo publicó, nada más |
| FMM 1 | Sin problemas técnicos abiertos; se planea probarlo |
| FMM 2 | Probado en al menos un connectathon con intercambio real entre 3+ sistemas |
| FMM 3 | Verificado formalmente y balotado como STU |
| FMM 4 | Implementado en múltiples sistemas prototipo/producción en más de un país |
| FMM 5 | Publicado en dos ciclos formales y desplegado en producción en 5+ sistemas independientes |
| **N (Normative)** | Balotado como normativo ANSI; estabilidad garantizada |

Lectura de dirección de proyecto: si vas a construir sobre un recurso FMM 1, presupuesta cambios; si es Normative, construye tranquilo. En R4, Patient y Observation son normativos; muchos recursos administrativos y financieros siguen en FMM bajos.

### IGs: los dialectos acordados

FHIR core define el lenguaje; las **Implementation Guides (IG)** definen dialectos: qué recursos usar, con qué perfiles, extensiones, terminologías y flujos, para un país o caso de uso. **US Core** (EE. UU.), **IPS** (resumen internacional del paciente), **Da Vinci** (pagador-proveedor), **mCODE** (oncología). La interoperabilidad real de un país vive en sus IG, no en FHIR core: esa es la lección central para quien dirige una integración nacional. Un país sin IG propio o adoptado tiene FHIR sintáctico, no semántico.

### El ecosistema en 2026

- **Connectathons**: eventos (dos o tres al año, más los locales) donde implementadores prueban recursos e IG en vivo. Son requisito de madurez FMM: FHIR se valida implementando.
- **chat.fhir.org** (Zulip): miles de implementadores, incluido el equipo núcleo. La respuesta a tu duda de producción probablemente ya está ahí.
- **registry.fhir.org / packages**: los IG y perfiles se distribuyen como paquetes NPM versionados; tu tooling (validador oficial, HAPI, SUSHI/FSH) los resuelve automáticamente.
- **Herramientas**: HAPI FHIR (Java, el servidor open source de referencia), Firely SDK (.NET), el **Validator** oficial, **FHIR Shorthand (FSH)** para escribir perfiles como código.
- **Coexistencia**: el patrón real en hospitales sigue siendo `sistemas legacy v2 -> motor de interfaces/mapper -> servidor FHIR -> apps modernas y analítica`. Google Cloud Healthcare API, Azure Health Data Services y AWS HealthLake no inventaron nada: **implementan** el estándar como infraestructura gestionada.

## Errores comunes y gotchas

- **"FHIR reemplazó a v2."** Falso. Coexisten y coexistirán décadas; los flujos internos hospitalarios siguen mayoritariamente en v2. FHIR domina las API hacia apps, pacientes y nube.
- **Confundir CDA con FHIR Documents.** CDA es XML del mundo v3; FHIR también tiene documentos (Bundle tipo `document` con Composition), pero granulares y consultables. En el examen, "documento clínico legal heredado" apunta a CDA/C-CDA.
- **"R5 es la versión que hay que estudiar porque es más nueva."** El examen Foundational y la producción mundial pivotan en **R4 (4.0.1)**. Novedad no es adopción.
- **Confundir Normative con "todo R4 es estable".** Solo partes de R4 son normativas; muchos recursos siguen en Trial Use con FMM bajo. Verifica el FMM del recurso antes de apostar tu arquitectura.
- **"Los segmentos Z de v2 son como las extensiones FHIR."** Parecido superficial: las extensiones FHIR llevan URL que las define y son validables contra perfiles; los Z-segments son opacos y no gobernados. Esa gobernanza es precisamente la mejora.
- **Atribuir FHIR a Google/Microsoft/Epic.** Lo gobierna HL7 International con proceso abierto; las empresas implementan y participan.
- **"Interoperabilidad = mandar JSON."** Eso es solo sintáctica. Sin terminologías y perfiles compartidos no hay semántica, y sin gobernanza no hay nada.

## Nivel experto

- **Por qué la 80/20 fue la decisión más importante**: v3 intentó modelar el 100 % de la semántica en el núcleo y murió de complejidad; v2 dejó el 40 % fuera y murió de dialectos. FHIR puso la variabilidad en un mecanismo formal (extension + StructureDefinition) que las máquinas pueden descubrir y validar. Cuando diseñes perfiles nacionales estarás administrando exactamente ese 20 %.
- **El costo oculto de la estabilidad normativa**: una vez que Patient es normativo, HL7 no puede arreglarle defectos de diseño rompiendo compatibilidad. Por eso verás soluciones "raras" que sobreviven por contrato de estabilidad, y por eso R6 es un evento mayor: congela decisiones para décadas.
- **Versionado real en producción**: "el servidor es R4" es simplificación. Cada servidor declara `fhirVersion` en su CapabilityStatement y cada paquete IG fija la versión FHIR que perfila. En integraciones multi-versión (un EHR DSTU2, un HIE R4) necesitarás transformación entre versiones (los mapeos existen, pero no son gratis ni completos).
- **v2 no está muerto ni lo estará pronto**: para flujos de altísimo volumen intra-hospital (ADT hacia 40 sistemas internos) un motor v2 sigue siendo más eficiente que 40 clientes REST. La decisión experta no es "todo FHIR", sino qué frontera del sistema se expone como FHIR.
- **Lecciones de gobernanza para un proyecto nacional**: HL7 logró adopción combinando (1) especificación gratuita, (2) prueba obligatoria en connectathons antes de madurar, (3) tracker público de cambios. Un IG nacional que no replique esas tres prácticas repite los errores de v3: estándar de escritorio sin implementadores.
- **De dónde vino cada pieza de tu stack**: CapabilityStatement desciende de la necesidad de autodescubrimiento que v2 nunca tuvo; los perfiles descienden del rigor de v3 pero hechos ejecutables; SMART descende del proyecto de apps sustituibles de Harvard. Nada en FHIR es casual: casi todo es una corrección histórica.

## Chuleta

| Concepto | Dato clave |
|----------|-----------|
| FHIR | Fast Healthcare Interoperability Resources; propuesto por Grahame Grieve, blog "Resources for Health", agosto 2011 |
| Interop. sintáctica vs semántica | Formato compartido vs significado compartido (terminologías + perfiles) |
| HL7 v2 | Desde 1988-89; segmentos (MSH, PID), delimitadores `\|^~\&`, ACK, Z-segments; ubicuo pero dialectal |
| HL7 v3 / RIM | Act-Entity-Role; riguroso, caro, adopción limitada; dejó CDA |
| CDA / C-CDA | Documento clínico XML monolítico; persiste por uso legal y regulación de EE. UU. |
| Regla 80/20 | Núcleo = lo que usa el 80 %; el resto vía extensiones y perfiles gobernados |
| Línea de tiempo | DSTU1 2014 -> DSTU2 2015 -> STU3 2017 -> **R4 2018/19 (normativo)** -> R4B 2022 -> R5 2023 -> R6 en balota |
| R4 normativo | API REST, formatos, datatypes, Patient, Observation, StructureDefinition, ValueSet, CodeSystem, CapabilityStatement, OperationDefinition |
| Argonaut | 2014-2016; vendors acuerdan perfiles DSTU2 + SMART; ancestro de US Core |
| SMART on FHIR | Harvard/Boston Children's; OAuth 2.0 + OpenID Connect perfilados para salud |
| FMM | 0-5 + Normative; FMM 2 exige connectathon; 5 exige producción en 5+ sistemas |
| Gobernanza | HL7 International: Work Groups, ballots STU/Normative, tracker público, espec. gratuita |
| IG | Dialecto acordado (US Core, IPS, Da Vinci, mCODE); ahí vive la interoperabilidad real |

## Autoevaluacion

1. Explica la diferencia entre interoperabilidad sintáctica y semántica con un ejemplo de laboratorio clínico.
2. Nombra los tres males crónicos de HL7 v2 y qué mecanismo de FHIR corrige cada uno.
3. ¿Qué es el RIM, sobre qué clases fundamentales se construye y por qué su rigor no se tradujo en adopción?
4. ¿Por qué C-CDA sigue en producción masiva si FHIR es "mejor"?
5. Describe la regla 80/20 de FHIR y su relación con extensiones y perfiles.
6. Ordena la línea de versiones desde DSTU1 hasta R6 con el aporte principal de cada una.
7. ¿Qué exige el FMM nivel 2 y qué garantiza el estado Normative?
8. ¿Qué cambió el Proyecto Argonaut en el comportamiento de los vendors de EHR?

### Respuestas

1. Sintáctica: ambos sistemas parsean el mismo formato (el mensaje llega y se procesa). Semántica: significan lo mismo; p. ej., "glucosa en ayunas" viaja como LOINC 1558-6 con unidad UCUM mg/dL en ambos lados, no como texto libre que cada sistema interpreta.
2. Opcionalidad extrema -> perfiles (StructureDefinition) que fijan cardinalidades; variantes locales/Z-segments -> extensiones con URL declarada y validable; mensajes-evento no consultables -> recursos con id, versionado y API REST (GET del estado actual).
3. Reference Information Model: modelo semántico formal basado en Act, Entity y Role (más Participation, ActRelationship, RoleLink) del que se derivaba todo contenido v3. Fracasó por curva de aprendizaje brutal, implementaciones caras y artefactos XML enormes: el rigor vivía en el núcleo y todo implementador debía pagarlo.
4. Porque los documentos clínicos legales (alta, epicrisis) necesitan persistencia, firma y contexto, y porque la regulación de EE. UU. (Meaningful Use) lo hizo obligatorio; el ecosistema instalado no se reemplaza de un día para otro.
5. El núcleo de cada recurso solo incluye los elementos que usa ~80 % de los sistemas; todo lo demás se representa con extensiones (con URL propia) restringidas y documentadas mediante perfiles. Así la variabilidad queda gobernada y validable en vez de anárquica (Z-segments) o aplastante (v3).
6. DSTU1 (2014, prueba de concepto) -> DSTU2 (2015, pilotos y Argonaut) -> STU3 (2017, CapabilityStatement, FHIRPath, adopción industrial) -> R4 (2018/2019, primer contenido normativo, versión de examen y producción) -> R4B (2022, puente con SubscriptionTopic) -> R5 (2023, Trial Use, adopción minoritaria) -> R6 (en balota normativa 2026-27).
7. FMM 2: el artefacto fue probado en un connectathon con intercambio exitoso entre al menos tres sistemas independientes. Normative: fue balotado como norma ANSI y tiene garantía de compatibilidad hacia adelante; los cambios incompatibles quedan prohibidos.
8. Que vendors competidores (Epic, Cerner, athenahealth...) implementaran los mismos perfiles DSTU2 y la misma autorización SMART/OAuth: FHIR pasó de estándar en papel a contrato ejecutable común, base de US Core y de la regulación posterior.

## Para profundizar

- [Resumen ejecutivo oficial de FHIR](http://hl7.org/fhir/R4/summary.html) — el pitch del propio estándar: qué problemas ataca y cómo; léelo tras esta lección para fijar la narrativa.
- [Overview de la especificación R4](http://hl7.org/fhir/R4/overview.html) — la introducción técnica oficial; conecta historia con arquitectura de la spec.
- [Confluence de HL7 FHIR](https://confluence.hl7.org/spaces/FHIR/overview) — el proceso vivo: Work Groups, connectathons, propuestas de cambio; aquí ves la gobernanza funcionando.
- [Blog Health Intersections (Grahame Grieve)](http://www.healthintersections.com.au/) — la fuente primaria del nacimiento de FHIR; busca las entradas de 2011 sobre "Resources for Health".
- [chat.fhir.org](https://chat.fhir.org/) — el Zulip de la comunidad; crea cuenta y observa los streams de implementadores: es la universidad informal de FHIR.
- [Lista de recursos R4 con su FMM](http://hl7.org/fhir/R4/resourcelist.html) — verifica el nivel de madurez de cualquier recurso antes de construir sobre él.
- [Certificación HL7 FHIR](https://www.hl7.org/certification/fhir.cfm) — la ficha oficial del examen Foundational Implementer que esta etapa prepara.
