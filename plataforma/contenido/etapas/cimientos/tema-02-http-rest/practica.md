# Practica

## Objetivo

Ejecutar el contrato REST completo contra un servidor real: read, vread, history, búsqueda con paginación, y (desde la PC) create, update con If-Match y un Bundle transaction con urn:uuid. Al terminar, cada código de estado te contará una historia en vez de sorprenderte.

## En el navegador (Laboratorio)

Usa el playground (GET contra `https://hapi.fhir.org/baseR4`; escribe solo el path).

1. Consulta: `Patient?family=Smith&_count=2`
   Qué observar: `type: "searchset"`, `total`, `entry[].search.mode` y el array `link`.
   Qué esperar: un Bundle con hasta 2 pacientes y un link `next` si hay más. Copia la URL de `next` y nota que es opaca (tokens `_getpages`).

2. Consulta: `Patient/[id]` (un id real del paso 1)
   Qué observar: ahora NO hay Bundle: es el recurso directo (interacción read). Ubica `meta.versionId`.
   Qué esperar: la diferencia estructural entre search (Bundle) y read (recurso).

3. Consulta: `Patient/[id]/_history`
   Qué observar: Bundle tipo `history` con las versiones; cada entry trae `request` indicando qué operación la produjo.
   Qué esperar: si `versionId` era 3, verás hasta 3 entradas.

4. Consulta: `Patient/[id]/_history/1`
   Qué observar: vread: la PRIMERA versión del recurso, aunque el estado actual sea otro.
   Qué esperar: comparar campos con el paso 2 y detectar qué cambió entre versiones.

5. Consulta: `Observation?code=8867-4&date=ge2024-01-01&_count=3`
   Qué observar: el prefijo `ge` pegado al valor y el efecto de `_count`.
   Qué esperar: solo observaciones de frecuencia cardiaca desde 2024; si `total` es 0, prueba `date=ge2020-01-01`.

6. Consulta: `Observation?patient=[id]&_include=Observation:patient&_count=5`
   Qué observar: entradas con `search.mode: "match"` (observaciones) y `"include"` (el paciente).
   Qué esperar: el paciente viaja en el MISMO Bundle sin segunda petición; los include no suman al total.

7. Consulta: `Patient/id-que-no-existe-999999`
   Qué observar: el error y el cuerpo.
   Qué esperar: 404 con un OperationOutcome; lee `issue[0].severity` y `diagnostics`.

## En la PC

Con el entorno del [Setup](/setup). Usa SOLO datos ficticios: es un servidor público.

Create con Prefer y captura del Location:

```powershell
curl -si -X POST "https://hapi.fhir.org/baseR4/Patient" -H "Content-Type: application/fhir+json" -H "Prefer: return=representation" -d "{\"resourceType\":\"Patient\",\"name\":[{\"family\":\"PruebaSV\",\"given\":[\"Laboratorio\"]}],\"gender\":\"female\",\"birthDate\":\"1990-01-01\"}"
```

Salida esperada: `HTTP/1.1 201 Created`, header `Location: .../Patient/[id]/_history/1`, `ETag: W/"1"` y el recurso con su id en el cuerpo.

Update con bloqueo optimista (usa TU id):

```powershell
curl -si -X PUT "https://hapi.fhir.org/baseR4/Patient/[id]" -H "Content-Type: application/fhir+json" -H "If-Match: W/\"1\"" -d "{\"resourceType\":\"Patient\",\"id\":\"[id]\",\"name\":[{\"family\":\"PruebaSV\",\"given\":[\"Laboratorio\",\"Editado\"]}],\"gender\":\"female\",\"birthDate\":\"1990-01-01\"}"
```

Salida esperada: `200 OK` y `ETag: W/"2"`. Repite el MISMO comando (sigue diciendo `If-Match: W/"1"`): ahora esperas **412 Precondition Failed**: acabas de ver el bloqueo optimista funcionando.

Transaction con urn:uuid (guarda el JSON de la lección en `tx.json` con un Patient y una Observation que lo referencia):

```powershell
curl -s -X POST "https://hapi.fhir.org/baseR4" -H "Content-Type: application/fhir+json" --data-binary "@tx.json"
```

Salida esperada: Bundle `transaction-response` con `response.status` "201 Created" en ambas entradas; abre la Observation creada y comprueba que `subject.reference` ya apunta a `Patient/[id-real]`, no a la urn.

Limpieza: `curl -si -X DELETE "https://hapi.fhir.org/baseR4/Patient/[id]"` (espera 200/204) y luego un GET del mismo id (espera **410 Gone**).

## Retos

1. Provoca deliberadamente un 400 y un 404 con curl y captura ambos OperationOutcome. Éxito: explicas por qué cada uno es ese código y no el otro.
2. Envía un POST de Observation sin `status` (campo 1..1). Éxito: recibes 422 (o 400 según el servidor) y citas el issue del OperationOutcome que lo delata.
3. Crea dos veces el mismo paciente ficticio usando `If-None-Exist` con un identifier inventado único. Éxito: primera vez 201, segunda vez 200 con el MISMO id (no hay duplicado).
4. Pagina una búsqueda (`Patient?_count=5`) siguiendo `link next` dos veces con curl o Python. Éxito: tres páginas sin construir ninguna URL a mano.
5. Convierte tu transaction en `type: "batch"` quitando la referencia urn:uuid (dos recursos independientes). Éxito: explicas por qué en batch la Observation NO podía referenciar al Patient del mismo Bundle.
6. Con `GET [base]/metadata`, verifica si HAPI declara `conditionalCreate` y `conditionalUpdate` para Patient. Éxito: citas los valores del CapabilityStatement.

## Reto Feynman

Explica a un colega no técnico, en 4-6 líneas: (1) por qué "guardar dos veces por si acaso" puede crear dos pacientes duplicados y cómo lo evita la creación condicional, y (2) qué pasa si dos enfermeras editan la misma ficha a la vez y cómo el sistema detecta al segundo con una "versión vieja" (bloqueo optimista).

## Criterio de completado

- [ ] Ejecuté las 7 consultas del Laboratorio y distingo Bundle searchset de recurso directo.
- [ ] Hice el ciclo completo en PC: 201 create, 200 update, 412 por If-Match viejo, 410 tras delete.
- [ ] Mi transaction con urn:uuid funcionó y verifiqué la referencia reescrita.
- [ ] Recito la tabla de códigos (400/401/403/404/405/410/412/422) con un ejemplo propio de cada uno.
- [ ] Pagině siguiendo link next sin fabricar URLs.
- [ ] Completé el Reto Feynman por escrito.
