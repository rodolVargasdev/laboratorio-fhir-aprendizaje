# Notas de estudio — Extra: Historia y nacimiento de FHIR

> Material de repaso para NotebookLM. Complementa la leccion del modulo extra (Dia 00).
> Generado: 2026-06-21

---

## Resumen ejecutivo (5 conceptos clave)

1. **Interoperabilidad** = dos sistemas de salud intercambian datos clinicos y el receptor los entiende sin reinterpretar a mano.
2. **HL7 v2** gano la calle (mensajes pipe-delimited) pero duele por opcionalidad y variaciones locales — no es una API web consultable.
3. **HL7 v3/RIM** fue semanticamente riguroso pero demasiado complejo y caro para adopcion masiva.
4. **FHIR (2011+)** = recursos individuales (Patient, Observation...) intercambiables por **HTTP REST + JSON**, con perfiles para acotar variacion.
5. **R4 (2019)** es tu ancla de examen Foundational; **Argonaut + SMART** convirtieron FHIR en contrato real entre vendors y desarrolladores.

---

## Linea de tiempo (memorizar en orden)

| Ano | Hito | Una frase |
|-----|------|-----------|
| 1989 | HL7 v2 | Mensajes con `\|` — ubiquos pero inconsistentes |
| 2000s | HL7 v3 + RIM | Modelo formal riguroso; adopcion limitada |
| 2011 | Inicio FHIR | Grahame Grieve — recursos web, no otro pipe |
| 2014 | DSTU1 + Argonaut | Primer borrador usable; vendors grandes se alinean |
| 2015 | DSTU2 | Pilotos masivos, primeros Implementation Guides |
| 2017 | STU3 | Adopcion industrial amplia |
| 2019 | **R4** | **Version normativa clave — base del examen** |
| 2023 | R5 | Evolucion; ecosistema aun en transicion desde R4 |

**Mnemonico:** *v2 calle → v3 pesado → FHIR web → Argonaut empuja → R4 ancla*

---

## Tabla comparativa: v2 vs v3 vs FHIR

| Aspecto | HL7 v2 | HL7 v3 / CDA | FHIR |
|---------|--------|--------------|------|
| Formato | Texto pipe `\|` | XML narrativo (CDA) | JSON (primero) o XML |
| Modelo | Mensajes por evento | RIM ontologico | Recursos modulares |
| Acceso | Canal de mensajes (ADT, ORU) | Documentos monoliticos | REST: GET /Patient/123 |
| Variacion | Opcionalidad extrema | Perfiles formales | Perfiles + IGs (US Core, IPS...) |
| Curva dev | Media (legacy) | Muy alta | Baja — curl + Python bastan |
| Hoy | Millones de interfaces activas | CDA/C-CDA en documentos | APIs modernas, apps, nube |
| Analogia | Telegramas clinicos | Edificio completo antes de tienda | APIs web como cualquier SaaS |

---

## Glosario rapido

| Termino | Significado |
|---------|-------------|
| **FHIR** | Fast Healthcare Interoperability Resources |
| **Resource** | Entidad tipada (Patient, Observation...) con id y ciclo de vida propio |
| **REST** | Patron HTTP: GET leer, POST crear, PUT/PATCH actualizar, DELETE borrar |
| **RIM** | Reference Information Model — base ontologica de HL7 v3 |
| **CDA** | Clinical Document Architecture — documentos XML clinicos |
| **DSTU / STU** | Draft/Standard for Trial Use — borrador para prueba en produccion |
| **R4** | Primera version normativa clave para muchos recursos (2019) |
| **IG** | Implementation Guide — "dialecto" acordado (US Core, Da Vinci, IPS) |
| **Argonaut** | Proyecto 2014-2016: Epic, Cerner, perfiles concretos + OAuth |
| **SMART on FHIR** | Capa OAuth 2.0 + scopes para apps de terceros sobre FHIR |
| **CapabilityStatement** | El servidor declara en /metadata que soporta |
| **US Core** | IG minimo EE.UU. para interoperabilidad nacional |
| **IPS** | International Patient Summary — resumen del paciente para fronteras |

---

## Por que nacio FHIR (narrativa en 8 frases — guia Feynman)

1. HL7 v2 domino hospitales con mensajes rapidos, pero cada sitio interpretaba campos distinto — interoperabilidad real era un mito.
2. v2 no permite consultar "dame el paciente 123" como una API web; solo empuja eventos puntuales por un canal.
3. HL7 v3 intento rigor con RIM y XML, pero era demasiado complejo y lento de implementar para el mercado.
4. CDA empaqueta documentos utiles legalmente, pero extraer un dato granular (ej. hemoglobina) es trabajo extra.
5. FHIR (2011, Grahame Grieve) aposto por recursos modulares + HTTP + JSON — patrones que cualquier desarrollador web conoce.
6. Ciclos DSTU/STU permitieron feedback de implementadores reales antes de congelar R4.
7. Argonaut (2014-2016) alineo vendors gigantes y SMART — FHIR paso de "bonito en papel" a contrato de produccion.
8. FHIR no reemplazo v2 de golpe: coexistencia con mappers v2→FHIR durante anos; tu rol en la integración nacional sera implementar en ese mundo hibrido.

---

## Errores comunes en examen (evitar)

| Error | Correccion |
|-------|------------|
| "FHIR reemplazo v2 de la noche a la manana" | Falso — coexistencia larga con mappers |
| "El examen es sobre R5" | Foundational pivota en **R4** (verificar si cambia) |
| "CDA es lo mismo que FHIR Resources" | CDA = documentos; FHIR = recursos granulares consultables |
| "FHIR es propiedad de Google/Epic" | Estandar abierto HL7; gratis de implementar |
| "v2 no sirve para nada hoy" | Sigue activo en millones de interfaces — FHIR convive con el |
| Confundir Argonaut con SMART | Argonaut = proyecto de alineacion; SMART = capa OAuth/apps |

---

## Conexion con el Dia 1 (lo que viene)

| Concepto historico | Lo veras en Dia 1 como... |
|--------------------|---------------------------|
| FHIR usa JSON | Leer un Patient en JSON local y desde HAPI |
| Recursos identificables | `resourceType`, `id`, GET /Patient/123 |
| API REST sobre HTTP | `ejercicio_2_servidor.py` — primer GET real |
| Servidor se autodescribe | `GET .../metadata` → CapabilityStatement |
| Servidor publico gratis | hapi.fhir.org/baseR4 (sin costo) |

---

## Preguntas tipo examen (practica sin mirar respuestas)

1. Que significa FHIR?
2. Principal debilidad practica de HL7 v2?
3. Por que v3 no domino el mercado?
4. Ano aproximado del inicio del trabajo en FHIR?
5. Version normativa clave para Foundational?
6. Que fue el Proyecto Argonaut?
7. Que aporta SMART on FHIR?
8. Que es un Implementation Guide vs FHIR core?
9. FHIR reemplazo v2 completamente? (V/F)
10. Que es un CapabilityStatement y donde se obtiene?

*(Respuestas en la seccion Quiz del export principal.)*

---

## Plan de estudio sugerido en NotebookLM (3 sesiones)

### Sesion 1 — Mapa mental (20 min)
- Sube `extra-historia-fhir-notebooklm.md` + este archivo.
- Prompt: *"Dibuja un mapa mental textual: v2 → v3 → FHIR → Argonaut → R4. Incluye fechas."*
- Genera **Audio Overview** y escuchalo una vez.

### Sesion 2 — Examen oral (25 min)
- Prompt: *"10 preguntas estilo HL7 Foundational sobre historia de FHIR. Espera mi respuesta antes de corregir."*
- Anota en PROGRESO.md lo que falles.

### Sesion 3 — Feynman + cierre (15 min)
- Explica con tus palabras la narrativa de 8 frases (arriba) sin leer.
- Prompt: *"Voy a explicarte por que existe FHIR. Detecta errores y vacios."*
- Cierra con quiz en terminal: `python evaluacion/quiz_runner.py --extra historia-fhir`

---

## Fuentes oficiales recomendadas (opcional en NotebookLM)

- HL7 FHIR Confluence (historia): https://confluence.hl7.org/display/FHIR
- Especificacion R4: http://hl7.org/fhir/R4/
- Metadata HAPI (CapabilityStatement vivo): https://hapi.fhir.org/baseR4/metadata

---

## 3 cosas que quiero recordar manana

1. FHIR = recursos web (REST + JSON), no mensajes pipe ni XML monolitico.
2. R4 (2019) + Argonaut/SMART = adopcion real, no solo comite.
3. v2 sigue vivo — implementas en un mundo hibrido, no greenfield puro.
