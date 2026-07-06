# 📱 Tema 0 · Por qué existe FHIR

> Pack de lectura para celular. Estúdialo donde sea; la práctica en PC está en RUTA.md.

## Qué vas a dominar

- Explicar el problema de interoperabilidad que HL7 v2 dejó a medias y por qué v3 no lo resolvió.
- Contar la línea de tiempo de FHIR: DSTU1 → DSTU2 → STU3 → **R4 (2019)** → R4B → R5.
- Definir qué es un "recurso" FHIR y por qué ese enfoque cambió todo.
- Explicar el papel de Argonaut y SMART on FHIR en la adopción comercial.
- Distinguir "normativo" de "Trial Use" y saber por qué R4 es tu ancla de examen.
- Ubicar a HL7 International como organismo que gobierna el estándar (ballots, Work Groups).

## Lectura

### El dolor original: hospitales que no se entienden

Interoperabilidad en salud significa que dos sistemas distintos (un hospital, un laboratorio, una aseguradora) intercambien datos clínicos y el receptor los entienda **sin reinterpretar a mano**. Durante décadas, eso fue más aspiración que realidad.

Desde 1989, **HL7 Versión 2** dominó el mercado. Sus mensajes son texto plano con campos separados por `|` (pipe):

```
PID|1||12345^^^Hospital||Perez^Juan||19850315|M
```

Ese segmento PID describe un paciente. Es rápido de generar y millones de interfaces v2 siguen vivas hoy. Pero tiene tres males crónicos:

1. **Opcionalidad extrema**: el mismo dato puede viajar en campos distintos según el hospital.
2. **Variaciones locales**: cada sitio "interpreta" el estándar a su manera; conectar dos hospitales exige un proyecto de mapeo cada vez.
3. **Es un evento, no un documento**: un mensaje ADT (admisión) pasa por un canal y desaparece. No puedes hacer "GET del paciente 123" como en una API web.

Analogía: v2 son **telegramas clínicos**. Rápidos y ubicuos, pero cada operador tiene su jerga y no hay dónde "consultar" nada después.

### v3: el edificio perfecto que casi nadie habitó

En los 2000, HL7 respondió con **Versión 3**, construida sobre el **RIM** (Reference Information Model): un modelo semántico riguroso, en XML, académicamente impecable. De ahí salió **CDA** (Clinical Document Architecture), que aún se usa para documentos clínicos legales (en EE.UU., como C-CDA).

¿El problema? Curva de aprendizaje brutal, implementaciones caras y lentas. Extraer "solo la hemoglobina del último análisis" de un documento CDA monolítico es trabajo extra. Fuera de nichos, v3 no llegó a producción masiva.

Analogía: v3 fue **construir el edificio completo antes de abrir una sola tienda**. Correcto en papel; inviable en la calle.

### 2011: nace FHIR, pensado para la web

**FHIR = Fast Healthcare Interoperability Resources**. El trabajo arrancó hacia 2011, liderado por **Grahame Grieve** con HL7 y la comunidad global. La apuesta fue radicalmente pragmática:

> Modelar la salud como **recursos** individuales e identificables, intercambiables por **HTTP/REST**, serializables en **JSON o XML**, con reglas claras de extensión y perfiles.

Cada cosa importante (Patient, Observation, Medication, Encounter…) es un **recurso** con su `resourceType`, su `id`, contenido estructurado, metadatos (`meta`) e historial de versiones. Ya no piensas en "mensajes que pasan": piensas en documentos consultables con `GET /Patient/123`, igual que cualquier API web moderna.

Principios de diseño que debes poder recitar:

- **API REST sobre HTTP**: los mismos verbos que usa toda la web.
- **Formatos familiares**: JSON primero; XML para quien lo necesite.
- **Recursos modulares** que se referencian entre sí en vez de mensajes monolíticos.
- **Extensibilidad controlada**: perfiles (StructureDefinition) y extensions acotan la variación sin repetir el caos de v2.
- **Barato de implementar**: un dev con curl empieza en horas, no en meses.
- **Coexistencia, no big-bang**: hay mapeos v2→FHIR y CDA→FHIR; se asumió un mundo híbrido por décadas.
- **Especificación abierta y gratuita**, con proceso de ballot comunitario en HL7.

### La maduración: DSTU y la ola Argonaut

FHIR no nació terminado. Pasó por ciclos de borrador con uso real: **DSTU1 (~2014)**, **DSTU2 (~2015)**, **STU3 (~2017)**. Cada ciclo incorporó feedback de implementadores: FHIR se forjó en producción, no solo en comités.

El punto de inflexión comercial fue el **Proyecto Argonaut** (2014–2016): HL7 junto a Epic, Cerner, athenahealth y otros definió perfiles concretos (paciente, alergias, medicación, problemas) y adoptó **OAuth 2.0 + OpenID Connect vía SMART on FHIR** para apps de terceros. Por primera vez, varios EHR competidores exponían **las mismas APIs**. Sin Argonaut, FHIR habría sido "otro estándar bonito"; con Argonaut, se volvió contrato real entre vendors y desarrolladores.

**SMART on FHIR** (Substitutable Medical Applications, Reusable Technologies) añadió la capa de seguridad y lanzamiento de apps: un portal autoriza scopes como `patient/Observation.read` y la app consume recursos. Es el ancestro directo de tu Tema 3.

### R4: tu versión de examen

| Versión | Año | Significado |
|---------|-----|-------------|
| DSTU1 | 2014 | Primer borrador usable |
| DSTU2 | 2015 | Pilotos masivos |
| STU3 | 2017 | Adopción industrial amplia |
| **R4** | **2019** | **Primera versión con contenido normativo** (Patient, Observation y otros pilares estables) |
| R4B | 2022 | Puente menor hacia R5 |
| R5 | 2023 | Evolución; ecosistema aún en transición |

**Normativo** = reglas estables para implementar a largo plazo, con compatibilidad garantizada hacia adelante. **Trial Use (DSTU/STU)** = se espera feedback y cambios controlados. Para la certificación **HL7 FHIR Foundational Implementer**, el foco es **R4**: es la versión que corre en la mayoría de la producción mundial (incluido Google Cloud Healthcare API y HAPI FHIR).

Con R4 también maduraron piezas que usarás todo el año: terminología como ciudadana de primera clase (CodeSystem, ValueSet, ConceptMap), operaciones estandarizadas (`$validate`, `$expand`, `$everything`) y el **CapabilityStatement**, con el que todo servidor declara en `GET [base]/metadata` qué soporta.

### Quién manda: HL7 International

FHIR no es de ninguna empresa. **HL7 International** lo mantiene: los **Work Groups** proponen cambios, los **ballots** comunitarios los votan, y todo se publica gratis en hl7.org/fhir. Cualquiera implementa FHIR sin pagar licencia. La discusión abierta vive en Confluence y en chat.fhir.org (Zulip).

Sobre esa base viven los **Implementation Guides (IGs)**: "dialectos acordados" por país o caso de uso. US Core (EE.UU.), IPS (resumen internacional del paciente), Da Vinci (pagadores). Lección para DoctorSV: la interoperabilidad real vive en los perfiles e IGs, no solo en FHIR core.

### Errores comunes de novato (y de examen)

- Creer que FHIR **reemplazó** a v2 de un día para otro. Falso: coexisten y coexistirán; el patrón real es `legacy v2 → mapper → servidor FHIR → apps modernas`.
- Confundir **CDA** (documento XML monolítico del mundo v3) con **recursos FHIR** (granulares y consultables).
- Estudiar R5 para el examen Foundational: el examen y la mayoría de producción pivotan en **R4**.
- Pensar que Google/AWS "inventaron" FHIR: solo **implementan** el estándar en infraestructura gestionada.

## Chuleta

| Concepto | Dato clave |
|----------|-----------|
| FHIR | Fast Healthcare Interoperability Resources |
| Líder inicial | Grahame Grieve (~2011, con HL7) |
| HL7 v2 | Mensajes con pipes `\|`, desde 1989, aún omnipresente |
| HL7 v3 / RIM | Modelo riguroso en XML; adopción limitada; dejó CDA |
| R4 | 2019, primera versión con contenido normativo, base del examen |
| Argonaut | 2014–2016: Epic/Cerner/etc. acuerdan perfiles + SMART |
| SMART on FHIR | OAuth 2.0 perfilado para apps de salud (scopes) |
| IG | Implementation Guide: perfiles acordados (US Core, IPS) |
| CapabilityStatement | `GET [base]/metadata`: qué soporta el servidor |
| Gobernanza | HL7 International: Work Groups + ballots; espec. gratuita |

## Autoevaluación (sin mirar arriba)

1. ¿Qué tres problemas crónicos tenía HL7 v2 que motivaron buscar algo nuevo?
2. ¿Por qué v3 fracasó en adopción pese a ser semánticamente superior?
3. ¿Qué significa que R4 (2019) tenga contenido "normativo" y por qué te importa para el examen?
4. ¿Qué logró el Proyecto Argonaut que FHIR solo no había logrado?
5. ¿Qué recurso pides con `GET [base]/metadata` y qué te dice?

## Para NotebookLM

1. Sube este archivo como fuente a un cuaderno llamado "FHIR — Tema 0 Historia".
2. Añade estos enlaces oficiales como fuentes:
   - https://confluence.hl7.org/display/FHIR — historia, proceso y FAQ oficiales de FHIR en HL7.
   - http://hl7.org/fhir/overview.html — introducción oficial al estándar y su filosofía.
   - http://hl7.org/fhir/R4/ — página raíz de la especificación R4, tu versión de examen.
   - http://hl7.org/fhir/smart-app-launch/ — la especificación SMART, hija directa de la era Argonaut.
3. Prompts sugeridos:
   - "Hazme un examen oral de 10 preguntas sobre la historia de FHIR, de la más fácil a la más difícil, sin darme las respuestas hasta que yo intente."
   - "Compara HL7 v2, v3/CDA y FHIR en una tabla: formato, estilo de intercambio, adopción y debilidades."
   - "Enumera los 5 errores conceptuales más comunes al contar la historia de FHIR y explica por qué son errores."

---

### Respuestas

1. Opcionalidad extrema (mismo dato en campos distintos), variaciones locales por sitio, y ser mensajes-evento no consultables (sin GET a un recurso).
2. Curva de aprendizaje brutal del RIM, implementaciones caras y lentas, y documentos difíciles de consultar granularmente; el mercado necesitaba agilidad.
3. Normativo = semántica estable con compatibilidad hacia adelante para recursos maduros; el examen Foundational y la mayoría de la producción usan R4.
4. Que vendors competidores (Epic, Cerner, athenahealth…) expusieran las mismas APIs con perfiles comunes y seguridad SMART/OAuth: adopción comercial real.
5. El CapabilityStatement: la declaración del servidor sobre qué recursos, interacciones, formatos y parámetros de búsqueda soporta.
