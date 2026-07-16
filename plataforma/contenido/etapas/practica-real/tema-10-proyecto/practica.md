# Practica

## Objetivo

Producir, en orden, los 10 entregables del proyecto integrador de la red nacional: del diagnóstico a la propuesta ejecutiva, pasando por el perfil PacienteNacional validado, la matriz de scopes, las búsquedas operativas, el catálogo terminológico y el piloto GCP con limpieza a $0. Al cerrar, agendar el simulacro del Foundational.

## Preparacion

- Entorno del curso ya montado (Python, curl, gcloud; ver [Setup](/setup)).
- Servidor HAPI público para pruebas sin costo: `https://hapi.fhir.org/baseR4` (datos públicos y efímeros: solo sintéticos).
- Opcional recomendado: Node.js con SUSHI (`npm install -g fsh-sushi`) para el reto de FSH.
- GCP configurado como en el tema 8 (proyecto, gcloud autenticado) para el entregable del piloto.
- Una carpeta `proyecto-nacional/` en tu repositorio con un subdirectorio por entregable.

## Ejercicios guiados

1. **Diagnóstico de interoperabilidad (entregable 1).** Crea `01-diagnostico.md` con una tabla: sistema, dueño, formato actual (v2/CSV/API), volumen diario estimado, identificador de paciente que usa, y brecha principal. Mínimo 5 sistemas (reales o plausibles de la red nacional). Verifica: cada fila termina con una decisión — traducir en la capa de integración, conectar como cliente SMART, o posponer.

2. **Instancia PacienteNacional y validación (entregables 2 y 7).** Guarda `paciente-nacional.json` con `meta.profile`, DUI en `identifier` (system `https://fhir.salud.gob.sv/identificadores/dui`), `name`, `gender` y `birthDate`. Valida la estructura base contra HAPI:

   ```bash
   curl -sS -X POST "https://hapi.fhir.org/baseR4/Patient/$validate" \
     -H "Content-Type: application/fhir+json" \
     -d @paciente-nacional.json
   ```

   Salida esperada: `OperationOutcome` sin issues de severidad `error`. Ahora rompe la instancia (borra `birthDate`, cambia `gender` a `"F"`) y guarda ambos OperationOutcome comentados. Verifica: puedes explicar cada issue (severity, code, expression).

3. **Matriz de scopes (entregable 3).** Crea `03-matriz-scopes.md` con al menos 6 filas: actor, flujo (App Launch / Backend Services), scope v2 exacto, justificación de mínimo privilegio. Incluye laboratorio (`system/Observation.c`), app de médicos (`user/...rs`), app de pacientes (`patient/...rs`), epidemiología (`system/...rs` + Group/$export), auditoría y BI. Verifica: ningún actor tiene `.*` ni `.cruds` sin justificación escrita.

4. **Consulta externa modelada (entregable 4).** Construye un Bundle `transaction` con Patient (DUI), Encounter ambulatorio, Condition (código CIE-10 o SNOMED), Observation de presión arterial (LOINC 85354-9) y MedicationRequest, todos enlazados con `urn:uuid:` y envíalo:

   ```bash
   curl -sS -X POST "https://hapi.fhir.org/baseR4" \
     -H "Content-Type: application/fhir+json" -d @consulta-externa.json
   ```

   Salida esperada: Bundle `transaction-response` con `201 Created` en cada entry. Verifica leyendo de vuelta el Encounter con `_include=Encounter:subject`.

5. **Cinco búsquedas operativas (entregable 5).** Documenta en `05-busquedas.md` cinco URLs contra `hapi.fhir.org/baseR4`, cada una con la pregunta de negocio que responde. Deben incluir al menos: una por `identifier` (buscar por DUI), una con encadenamiento (`Observation?subject.identifier=...`), una con `_include` o `_revinclude`, una con rango de fechas y `_sort`, y una con `_summary=count`. Verifica: las cinco devuelven Bundle `searchset` coherente y pegas el `total` de cada una.

6. **Catálogo terminológico (entregable 6).** Crea un ValueSet nacional (ej. tipos de establecimiento de salud) y un ConceptMap de 5 códigos del catálogo interno de laboratorio a LOINC (ej. `GLU` -> `2345-7`). Verifica: ambos recursos pasan `$validate` genérico en HAPI y sus canonicals usan tu dominio `https://fhir.salud.gob.sv/`.

7. **Piloto GCP + flujo backend + propuesta (entregables 8, 9 y 10).** Reejecuta condensado el flujo del tema 8 (store R4 -> import Synthea -> export BigQuery -> una consulta epidemiológica -> limpieza documentada con captura del costo en $0). Adapta el script Python del tema 9 como evidencia del flujo Backend Services (manifiesto del export). Cierra redactando `10-propuesta.md` (5-8 páginas): resumen ejecutivo, arquitectura (diagrama del tema), fases (piloto -> primer hospital -> red), riesgos y quick wins. Verifica: otra persona técnica puede leer la propuesta y reproducir el piloto solo con tus documentos.

## Limpieza

Aplica el ritual del tema 8 al terminar el ejercicio 7:

```bash
gcloud healthcare datasets delete nacional-ds --location=us-central1 --quiet
gcloud storage rm -r gs://TU-BUCKET
bq rm -r -f -d TU-PROYECTO:fhir_analitica
```

En HAPI público no hay nada que limpiar (es efímero y compartido), pero nunca dejes ahí nada que se parezca a un dato real. Borra claves privadas locales del flujo backend.

## Retos

1. **FSH compilado**: escribe PacienteNacional en FSH y compílalo con SUSHI sin errores. Éxito: `sushi .` genera el StructureDefinition y explicas el slicing del identifier.
2. **Validación contra tu perfil**: valida tu instancia contra el StructureDefinition generado usando el validator oficial de HL7 (java -jar validator_cli.jar). Éxito: la instancia válida pasa y la rota falla exactamente donde predijiste.
3. **IPS mínimo**: construye a mano un Bundle document con Composition y las tres secciones obligatorias del IPS para tu paciente. Éxito: estructura document correcta (primera entry = Composition) y secciones con entries reales.
4. **Simulacro Foundational**: resuelve los quizzes acumulados de los temas 0-7 en modo examen, cronometrado, dos días distintos. Éxito: ≥65% ambos días; registra fechas y puntajes.
5. **Defensa oral**: graba 5 minutos de audio defendiendo la elección R4 + GCP + Backend Services ante un comité imaginario. Éxito: cubres costo, soberanía, seguridad y salida de emergencia (lock-in) sin leer.
6. **Plan Advanced**: redacta tu plan de estudio del Advanced Developer con los pesos estimados del temario y qué recurso usarás para cada dominio. Éxito: plan de 6-8 semanas con hitos medibles.

## Reto Feynman

Explica el proyecto completo en 90 segundos a alguien no técnico (un director de hospital): qué problema resuelve la red nacional, por qué un estándar y no integraciones a medida, qué es el resumen del paciente, y por qué la seguridad con llaves criptográficas y permisos mínimos protege a los pacientes. Sin mencionar ni una sigla técnica (ni FHIR, ni JWT, ni API).

## Criterio de completado

- [ ] Entregables 1-7 en `proyecto-nacional/` con la estructura indicada.
- [ ] Instancia PacienteNacional válida + dos inválidas con OperationOutcome explicados.
- [ ] Bundle de consulta externa aceptado como transaction y verificado con _include.
- [ ] Cinco búsquedas operativas documentadas con su pregunta de negocio y total.
- [ ] ValueSet y ConceptMap nacionales con canonicals propios.
- [ ] Piloto GCP ejecutado y limpiado (evidencia de costo $0) + manifiesto del flujo backend.
- [ ] Propuesta ejecutiva terminada y legible por terceros.
- [ ] Simulacro Foundational ≥65% en dos días distintos y examen agendado (o fecha decidida).
- [ ] Al menos 4 retos completados, incluido el simulacro.
