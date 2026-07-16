# Practica

## Objetivo

Operar la capa de terminología de verdad: resolver códigos con `$lookup`, validar con `$validate-code`, expandir ValueSets (incluido el patrón de typeahead con `filter`), traducir con `$translate` y detectar los errores de system que rompen integraciones.

## En el navegador (Laboratorio)

Contra `https://hapi.fhir.org/baseR4`; escribe solo el path.

1. **$lookup de un código LOINC.** Consulta:
   `CodeSystem/$lookup?system=http://loinc.org&code=8867-4`
   Qué observar: la respuesta es un recurso `Parameters` (no un Bundle) con `name`, `display` ("Heart rate") y posibles `property`. Respuesta esperada: display de frecuencia cardíaca; si el servidor no aloja LOINC completo puede delegar o fallar — anota qué hace.

2. **$lookup de un código FHIR propio.** Consulta:
   `CodeSystem/$lookup?system=http://hl7.org/fhir/observation-status&code=final`
   Respuesta esperada: display "Final". Nota que el system de los códigos de status es una URI de hl7.org/fhir, no de terminology.hl7.org.

3. **$expand de un ValueSet pequeño.** Consulta:
   `ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/administrative-gender`
   Qué observar: `expansion.timestamp` y `expansion.contains[]` con los 4 códigos (male, female, other, unknown). Respuesta esperada: la lista completa materializada.

4. **Typeahead con filter.** Consulta:
   `ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/observation-codes&filter=blood pressure&count=10`
   Qué observar: solo conceptos cuyo display matchea el filtro; este es el patrón de autocompletado de formularios clínicos. Respuesta esperada: códigos LOINC relacionados con presión arterial (85354-9 entre ellos).

5. **$validate-code correcto e incorrecto.** Consulta:
   `ValueSet/$validate-code?url=http://hl7.org/fhir/ValueSet/observation-status&code=final`
   y luego:
   `ValueSet/$validate-code?url=http://hl7.org/fhir/ValueSet/observation-status&code=finalizado`
   Respuesta esperada: `result = true` en la primera; `result = false` con `message` explicativo en la segunda. Así valida un servidor cada binding required.

6. **El error clásico: system inventado.** Consulta:
   `Observation?code=SNOMED|38341003&_count=3`
   Qué observar: cero resultados (o error), porque "SNOMED" no es la URI del sistema. Repite con `http://snomed.info/sct|38341003` y compara. Moraleja: los systems son URIs exactas.

7. **Códigos en recursos reales.** Consulta:
   `Condition?_count=5&_elements=code`
   Qué observar en cada `code`: cuántos codings trae, qué systems usan, si hay `text`. Respuesta esperada: mezcla real de SNOMED, ICD-10 y texto libre — el paisaje que una red nacional debe ordenar.

8. **Buscar por pertenencia jerárquica (si el servidor lo soporta).** Consulta:
   `Condition?code:below=http://snomed.info/sct|73211009&_count=5`
   Qué observar: si el servidor implementa `:below`, devuelve Conditions con diabetes **o cualquiera de sus subtipos** (subsunción); si no, puede ignorar el modificador o dar error — compara con el `self` link. Respuesta esperada: entiendes que la jerarquía de SNOMED se explota directamente desde la búsqueda, y que ese poder depende del servidor de terminología conectado.

9. **Inventario de systems.** Consulta:
   `Observation?_count=10&_elements=code`
   Cuenta cuántos `system` distintos aparecen en los codings. Respuesta esperada: una lista heterogénea; en tu institución, ese inventario es el primer paso real de cualquier proyecto de terminología.

## En la PC

Requiere [Setup](/setup). Usa también el servidor de referencia `https://tx.fhir.org/r4` (soporta SNOMED/LOINC completos).

**$subsumes contra tx.fhir.org:**

```bash
curl -s "https://tx.fhir.org/r4/CodeSystem/\$subsumes?system=http://snomed.info/sct&codeA=73211009&codeB=44054006" \
  -H "Accept: application/fhir+json"
```

Salida esperada: `Parameters` con `outcome = subsumes` (diabetes mellitus subsume diabetes tipo 2). Invierte codeA/codeB y verifica `subsumed-by`.

**Mini ConceptMap + $translate local en Python:**

```python
import json
mapa = {("cat-local", "HTA-01"): ("http://snomed.info/sct", "38341003", "equivalent")}
entrada = {"system": "cat-local", "code": "HTA-01", "text": "Hipertension arterial"}
destino = mapa.get((entrada["system"], entrada["code"]))
cc = {"coding": [
        {"system": entrada["system"], "code": entrada["code"]},
        {"system": destino[0], "code": destino[1]}],
      "text": entrada["text"]}
print(json.dumps(cc, indent=2, ensure_ascii=False))
```

Salida esperada: un CodeableConcept con **ambos** codings (local + SNOMED) y el text preservado — el patrón de integración nacional en miniatura.

## Retos

1. Encuentra con `$lookup` el display oficial de LOINC 4548-4 y de SNOMED 38341003 (usa tx.fhir.org para SNOMED). Éxito: obtienes ambos displays y sabes qué servidor respondió cada uno.
2. Valida el código `H` contra el ValueSet `http://hl7.org/fhir/ValueSet/administrative-gender`. Éxito: `result=false` y puedes explicar la diferencia entre "código inexistente" y "código existente fuera del conjunto".
3. Construye un typeahead: tres `$expand` sucesivos con `filter=dia`, `filter=diab`, `filter=diabetes` sobre un ValueSet de condiciones, `count=5`. Éxito: la lista se refina en cada paso.
4. Publica en HAPI (POST) un CodeSystem propio `content: complete` con 4 códigos de tipos de establecimiento de salud y un ValueSet que lo incluya completo. Éxito: `$expand` de tu ValueSet devuelve tus 4 códigos.
5. Crea un ConceptMap de 3 elementos de tu CodeSystem hacia SNOMED con al menos un `narrower`, publícalo y pruébalo con `$translate`. Éxito: el match devuelve la equivalence declarada.
6. Diseña (en papel) el binding correcto para "motivo de consulta" en un perfil nacional: ¿required, extensible o preferred? Éxito: puedes defender la elección con el matiz exacto de extensible.

## Reto Feynman

Explícale a una directora de hospital, sin tecnicismos, por qué "los dos hospitales ya mandan JSON" no significa que el ministerio pueda contar los diabéticos del país, y qué tres piezas (catálogo, subconjunto, mapa) faltan. Si logras que ella pueda repetirlo, dominas la interoperabilidad semántica.

## Criterio de completado

- [ ] Ejecuté las 5 operaciones ($lookup, $validate-code, $expand con filter, $translate, $subsumes) y reconozco sus respuestas Parameters.
- [ ] Sé escribir de memoria las URIs de LOINC, SNOMED CT y UCUM.
- [ ] Puedo explicar compose vs expansion y por qué una expansión cambia con el tiempo.
- [ ] Recito las 4 fuerzas de binding y el significado exacto de extensible.
- [ ] Publiqué un CodeSystem + ValueSet + ConceptMap propios y los operé.
- [ ] Completé al menos 4 de los 6 retos y el Reto Feynman.
