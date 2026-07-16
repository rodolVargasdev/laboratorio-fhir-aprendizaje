# Practica

## Objetivo

Leer, escribir y depurar recursos reales contra un servidor FHIR público: inspeccionar elementos comunes, seguir referencias a mano, construir un Observation con componentes y ejecutar un Bundle transaction con referencias `urn:uuid:`.

## En el navegador (Laboratorio)

Todos los ejercicios corren contra `https://hapi.fhir.org/baseR4`. Escribe solo el path en el Laboratorio.

1. **Anatomía de un recurso.** Consulta:
   `Patient?_count=1`
   Observa en la única entry: `resource.id`, `resource.meta.versionId`, `resource.meta.lastUpdated` y, si existe, `resource.text`. Respuesta esperada: un Bundle `type: searchset` con `total` y una entry cuyo `search.mode` es `match`.

2. **Identifier vs id.** Toma el `id` del paciente anterior (llámalo `{id}`) y consulta:
   `Patient/{id}`
   Compara `id` (raíz) con el array `identifier` (si existe): el primero es el id lógico del servidor; los segundos son identificadores de negocio con `system` + `value`. Respuesta esperada: el recurso Patient individual, sin envoltorio Bundle.

3. **Observation con valueQuantity.** Consulta:
   `Observation?code=8867-4&_count=3`
   (8867-4 = frecuencia cardíaca LOINC). Observa `code.coding[0].system` (`http://loinc.org`), `valueQuantity` (value/unit/system/code) y `status`. Respuesta esperada: Bundle searchset; cada entry con `subject.reference` apuntando a un Patient.

4. **Componentes (presión arterial).** Consulta:
   `Observation?code=85354-9&_count=2`
   Observa que el valor NO está en `valueQuantity` raíz sino en `component[]`: cada componente con su `code` (8480-6 / 8462-4) y su `valueQuantity`. Respuesta esperada: al menos una Observation con dos o más `component`.

5. **Seguir una referencia a mano.** De la Observation anterior copia `subject.reference` (p. ej. `Patient/597231`) y pégalo tal cual como path. Respuesta esperada: el Patient referenciado. Acabas de resolver una referencia literal relativa contra la base del servidor.

6. **Versión e historia.** Con el mismo paciente:
   `Patient/{id}/_history`
   Respuesta esperada: Bundle `type: history` con una entry por versión; compara con `meta.versionId`. Luego pide una versión concreta con `Patient/{id}/_history/1` y observa que es el recurso tal como existía en esa versión (referencia versionada).

7. **Compartimento del paciente.** Consulta:
   `Patient/{id}/$everything?_count=20`
   Respuesta esperada: Bundle searchset con el Patient y todos los recursos de su compartimento (Observations, Encounters, Conditions si existen). Observa cuántos tipos de recurso distintos aparecen: acabas de extraer una "historia clínica" completa con una sola llamada.

8. **Anatomía de un choice type.** En cualquier Observation de los ejercicios anteriores, localiza cómo se llama exactamente la propiedad del valor (`valueQuantity`, `valueCodeableConcept`, `valueString`...). Respuesta esperada: nunca verás dos variantes `value*` en el mismo nivel; si el recurso usa `component`, la raíz no lleva ninguna.

## En la PC

Requiere el entorno de [Setup](/setup).

1. **Transaction con urn:uuid.** Guarda como `tx.json` un Bundle transaction con un Patient y una Observation que lo referencia por `urn:uuid:` (usa el ejemplo de la lección, cambia los UUID). Envíalo:

```bash
curl -s -X POST "https://hapi.fhir.org/baseR4" \
  -H "Content-Type: application/fhir+json" \
  -d @tx.json
```

Salida esperada: Bundle `type: transaction-response` con dos entries; cada `response.status` es `201 Created` y `response.location` trae `Patient/{nuevoId}/_history/1`. Recupera la Observation creada y verifica que `subject.reference` ya NO es urn:uuid sino `Patient/{nuevoId}`: el servidor reescribió la referencia.

2. **Recorrer un Bundle en Python.**

```python
import requests
b = requests.get("https://hapi.fhir.org/baseR4/Observation",
                 params={"code": "85354-9", "_count": 5}).json()
indice = {e.get("fullUrl"): e["resource"] for e in b.get("entry", [])}
for e in b.get("entry", []):
    r = e["resource"]
    comps = {c["code"]["coding"][0]["code"]: c.get("valueQuantity", {}).get("value")
             for c in r.get("component", [])}
    print(r["id"], r.get("subject", {}).get("reference"), comps)
```

Salida esperada: una línea por Observation con su id, la referencia al paciente y un dict tipo `{'8480-6': 120, '8462-4': 80}`.

## Retos

1. Crea vía POST un Patient con un `identifier` cuyo `system` sea una URI tuya (p. ej. `https://midominio.example/id/expediente`). Éxito: status 201 y el recurso recuperable por `Patient?identifier=https://midominio.example/id/expediente|VALOR`.
2. Crea una Observation de peso corporal (LOINC 29463-7, unidad UCUM `kg`) referenciando a tu Patient. Éxito: `Observation?subject=Patient/{tuId}` la devuelve.
3. Crea una Observation con `dataAbsentReason` (código `unable-to-obtain` de `http://terminology.hl7.org/CodeSystem/data-absent-reason`) y SIN value[x]. Éxito: 201; luego intenta añadirle también valueQuantity y observa qué responde el servidor al validar.
4. Construye un Bundle `batch` con dos GET (`Patient/{tuId}` y una búsqueda) y envíalo por POST a la base. Éxito: batch-response con `response.status` 200 en ambas entries.
5. Repite el reto 4 como `transaction` incluyendo una entry con url inválida. Éxito: comprobar que el comportamiento difiere (transaction falla completa o el servidor devuelve error global).
6. Modela la consulta completa (Patient + Encounter + Condition hipertensión + MedicationRequest) en una sola transaction con urn:uuid cruzados. Éxito: 4 entries con 201 y referencias reescritas coherentes.

## Reto Feynman

Explica en voz alta (o por escrito, 10 líneas máximo) a un colega no técnico: por qué el `id` de un paciente puede ser distinto en cada hospital pero su DUI no, y cómo FHIR representa cada cosa. Si necesitas jerga para explicarlo, aún no lo dominas.

## Criterio de completado

- [ ] Ejecuté los 8 ejercicios del Laboratorio y sé distinguir searchset, history, $everything y recurso individual.
- [ ] Resolví una referencia literal a mano y sé contra qué base se resuelve.
- [ ] Envié una transaction con urn:uuid y verifiqué la reescritura de referencias.
- [ ] Distingo sin dudar Identifier vs id y component vs value[x].
- [ ] Completé al menos 4 de los 6 retos.
- [ ] Hice el Reto Feynman sin usar jerga.
