# Practica

## Objetivo

Tocar con tus manos las huellas de la historia que acabas de leer: comprobar que HAPI es un servidor R4, leer un CapabilityStatement (el autodescubrimiento que v2 nunca tuvo), y contrastar la granularidad de un recurso FHIR con el mundo de mensajes y documentos que lo precedió.

## En el navegador (Laboratorio)

Usa el playground de la app (GET contra `https://hapi.fhir.org/baseR4`; escribe solo el path).

1. Consulta: `metadata`
   Qué observar: es el **CapabilityStatement** del servidor. Busca `fhirVersion` (debe decir `4.0.1`: exactamente la versión de tu examen) y `format` (verás `application/fhir+json` y `application/fhir+xml`).
   Qué esperar: un recurso enorme; no lo leas entero, solo ubica esos dos campos y la lista `rest[0].resource` (los tipos que el servidor soporta).

2. Consulta: `Patient?_count=1`
   Qué observar: la respuesta es un `Bundle` con `entry[0].resource`. Dentro del recurso, ubica `resourceType`, `id` y `meta.versionId`/`meta.lastUpdated`.
   Qué esperar: esto es lo que v2 no podía darte: el **estado actual consultable** de un paciente, con identidad y versión. Un ADT era un evento que pasaba; esto es un recurso que existe.

3. Consulta: `Patient/[id]/_history` (usa el `id` real del paso 2)
   Qué observar: un Bundle de tipo `history` con las versiones del recurso.
   Qué esperar: el historial de cambios, otra capacidad impensable en mensajería v2.

4. Consulta: `StructureDefinition?kind=resource&_count=3`
   Qué observar: los recursos que definen recursos. FHIR se describe a sí mismo con sus propias piezas (herencia directa del rigor de v3, pero ejecutable).
   Qué esperar: un Bundle con definiciones; ubica en alguna entry el campo `fhirVersion`.

5. Consulta: `Patient?_format=xml&_count=1`
   Qué observar: el mismo tipo de dato del paso 2, ahora en XML con el namespace `http://hl7.org/fhir` y valores en atributos `value=`.
   Qué esperar: comprobar que JSON y XML son el mismo modelo con distinto traje (lo estudiarás a fondo en el tema de formatos).

## En la PC

Si ya hiciste el [Setup](/setup), repite el descubrimiento desde la terminal:

```powershell
curl -s https://hapi.fhir.org/baseR4/metadata?_summary=true -H "Accept: application/fhir+json"
```

Salida esperada (fragmento): un JSON con `"resourceType": "CapabilityStatement"` y `"fhirVersion": "4.0.1"`. El parámetro `_summary=true` reduce el tamaño de la respuesta.

Compara con un mensaje v2: abre cualquier ejemplo de mensaje ADT (el de la lección sirve) y pregúntate cómo harías con él lo que acabas de hacer con dos URLs.

## Retos

1. En el CapabilityStatement de HAPI, encuentra cuántas interacciones declara para `Patient` (busca `interaction` dentro de la entrada de Patient). Éxito: puedes listar al menos read, search-type, create y update.
2. Averigua (con `metadata`) si HAPI declara soporte de formato XML además de JSON. Éxito: citas el valor exacto del array `format`.
3. Toma el segmento `PID|1||12345^^^HOSP01^MR||Perez^Juan...` de la lección y escribe en papel a qué campos de un recurso `Patient` R4 mapearías PID-3, PID-5 y PID-7. Éxito: mencionas `identifier`, `name` (family/given) y `birthDate`.
4. Busca en `hl7.org/fhir/R4/resourcelist.html` el FMM de `Patient`, `Encounter` y `AppointmentResponse`. Éxito: identificas cuál es normativo y cuál tiene madurez baja, y explicas qué implicaría para un proyecto.
5. En chat.fhir.org (solo lectura, sin cuenta puedes ver algunos streams públicos), localiza el stream "implementers". Éxito: describes qué tipo de preguntas se hacen ahí y guardas el enlace.
6. Escribe tres diferencias concretas entre un Z-segment de v2 y una extensión FHIR. Éxito: al menos una menciona la URL de definición y otra la validación contra perfiles.

## Reto Feynman

Explica a un colega no técnico, en 4-6 líneas: (1) por qué los hospitales llevan 30 años "conectados" y aun así integrar dos sistemas cuesta meses, y (2) qué cambió FHIR para que una app pueda pedir "el paciente 123" como quien abre una página web. Sin jerga: telegramas, dialectos y ventanilla de consulta son buenas imágenes.

## Criterio de completado

- [ ] Ejecuté las 5 consultas del Laboratorio y encontré `fhirVersion 4.0.1` en el CapabilityStatement.
- [ ] Puedo explicar la diferencia entre interoperabilidad sintáctica y semántica sin releer.
- [ ] Reconstruyo de memoria la línea de tiempo DSTU1 -> R4 -> R6 con el aporte de cada versión.
- [ ] Sé qué significa FMM 2, FMM 5 y Normative, y por qué le importan a un director de proyecto.
- [ ] Mapeé mentalmente un segmento PID a campos de Patient.
- [ ] Completé el Reto Feynman por escrito.
