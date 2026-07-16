# Practica

## Objetivo

Leer recursos FHIR reales con ojos de validador: localizar `resourceType`, `id`, `meta`, tipos primitivos y complejos, choice types y narrativa, tanto en JSON como en XML, y detectar representaciones inválidas a simple vista.

## En el navegador (Laboratorio)

Usa el playground (GET contra `https://hapi.fhir.org/baseR4`; escribe solo el path).

1. Consulta: `Patient?_count=1`
   Qué observar: en `entry[0].resource`, localiza `id`, `meta.versionId`, `meta.lastUpdated` y, si existe, `text.div`.
   Qué esperar: `lastUpdated` con formato instant completo (fecha, hora con milisegundos y zona). Comprueba que `name` es un array aunque traiga un elemento.

2. Consulta: `Observation?_count=1`
   Qué observar: el choice type: ¿la instancia trae `valueQuantity`, `valueCodeableConcept`, `valueString` u otro? Anota cuál y confirma que solo hay UNA variante.
   Qué esperar: si es `valueQuantity`, revisa `value` (decimal), `unit` (texto) y `system`/`code` (UCUM en `http://unitsofmeasure.org`).

3. Consulta: `Observation?code=8867-4&_count=1`
   Qué observar: `code.coding[0].system` y `code.coding[0].code`.
   Qué esperar: `http://loinc.org` y `8867-4` (frecuencia cardiaca). Practica la ruta completa: `Observation.code.coding[0].code`.

4. Consulta: `Patient?_count=1&_format=xml`
   Qué observar: el MISMO tipo de recurso en XML: etiqueta raíz, `xmlns="http://hl7.org/fhir"`, primitivos en atributos `value=`, `given` repetido si hay varios nombres.
   Qué esperar: poder señalar dónde quedó cada cosa que viste en JSON. El Bundle también cambia de forma: `<entry><resource><Patient>...`.

5. Consulta: `MedicationRequest?_count=5`
   Qué observar: busca en las entradas el choice `medication[x]`: ¿aparece `medicationCodeableConcept` o `medicationReference`? Si alguna trae `contained`, localiza la referencia interna `#...`.
   Qué esperar: ver el mismo elemento lógico con dos representaciones distintas según la instancia: eso es un choice type en la práctica.

6. Consulta: `Patient/[id]/_history` (con el id del paso 1)
   Qué observar: cómo `meta.versionId` cambia entre versiones mientras `id` permanece.
   Qué esperar: la diferencia id lógico vs versión, vivida.

## En la PC

Con el entorno del [Setup](/setup):

```powershell
python -c "import urllib.request, json; b = json.load(urllib.request.urlopen('https://hapi.fhir.org/baseR4/Observation?code=8867-4&_count=1')); r = b['entry'][0]['resource']; print(r['resourceType'], r['code']['coding'][0]['code'], r.get('valueQuantity', {}).get('value'))"
```

Salida esperada: `Observation 8867-4` seguido del valor numérico (o `None` si esa instancia usa otra variante de value[x]: hallazgo igual de valioso).

Round-trip JSON/XML con curl:

```powershell
curl -s "https://hapi.fhir.org/baseR4/Patient?_count=1" -H "Accept: application/fhir+xml"
```

Salida esperada: un Bundle XML; verifica el atributo `value=` en los primitivos.

## Retos

1. En un Patient real de HAPI, escribe las rutas de: primer apellido, segundo nombre de pila, y sistema del primer identificador. Éxito: `name[0].family`, `name[0].given[1]`, `identifier[0].system`.
2. Clasifica estos valores como date/dateTime/instant válido o inválido: `2026`, `2026-07`, `2026-07-10T08:30:00`, `2026-07-10T08:30:00Z`, `2026-07-10T08:30:00.123-06:00`. Éxito: detectas que el tercero es el único inválido (hora sin zona).
3. Escribe a mano un Patient JSON mínimo válido con: un identifier (system+value), un name oficial con dos given, gender y birthDate. Éxito: los repetibles son arrays, sin null, sin comentarios.
4. Convierte mentalmente (o en papel) tu Patient del reto 3 a XML. Éxito: etiqueta raíz con namespace, primitivos en `value=`, given repetido.
5. Detecta los DOS errores de esta instancia: `{"resourceType":"Observation","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"8867-4"}]},"valueQuantity":{"value":72},"valueString":"72 lpm","effectiveDateTime":"2026-07-10T08:30:00"}`. Éxito: dos variantes de value[x] simultáneas + dateTime con hora sin zona horaria.
6. En la página de datatypes de R4, busca la definición del tipo `canonical` y explica con tus palabras el sufijo `|4.0.1`. Éxito: referencia a artefacto canónico con versión específica.

## Reto Feynman

Explica a un colega no técnico, en 4-6 líneas: (1) por qué el mismo expediente puede tener un "número de ficha" distinto en cada hospital pero el DUI es el mismo en todos (id lógico vs identifier), y (2) por qué las computadoras necesitan que "72 latidos por minuto" viaje como número + unidad codificada y no como frase.

## Criterio de completado

- [ ] Ejecuté las 6 consultas del Laboratorio e identifiqué meta, choice types y arrays.
- [ ] Distingo sin dudar id / identifier / versionId y code / Coding / CodeableConcept.
- [ ] Clasifico date vs dateTime vs instant y sé cuándo la zona horaria es obligatoria.
- [ ] Leí el mismo recurso en JSON y XML y ubico primitivos, repetición y namespace en ambos.
- [ ] Detecté los dos errores del reto 5 sin ayuda.
- [ ] Escribí un Patient mínimo válido a mano y completé el Reto Feynman.
