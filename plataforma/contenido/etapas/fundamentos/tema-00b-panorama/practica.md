# Practica

## Objetivo

Verificar en servidores reales el panorama que acabas de leer: qué versión corre la industria, cómo se declara la conformidad, cómo se ven los perfiles de un IG y qué aspecto tiene la terminología operativa. Al terminar sabrás distinguir un servidor R4 de uno R5 en 30 segundos y localizar la evidencia, no la opinión.

## En el navegador (Laboratorio)

Usa el playground (GET contra `https://hapi.fhir.org/baseR4`; escribe solo el path).

1. Consulta: `metadata?_summary=true`
   Qué observar: `fhirVersion` en el CapabilityStatement.
   Qué esperar: `4.0.1`. Esa cifra exacta es tu versión de examen; si un servidor dijera `5.0.0`, todo este curso te obligaría a leer con otros ojos.

2. Consulta: `Observation?_count=1`
   Qué observar: dentro de `entry[0].resource`, el campo `category` y el `code.coding[0].system`.
   Qué esperar: sistemas de códigos reales (LOINC en `http://loinc.org`, categorías del CodeSystem `observation-category`). Es la terminología del panorama funcionando.

3. Consulta: `StructureDefinition?url=http://hl7.org/fhir/StructureDefinition/Patient`
   Qué observar: si el servidor aloja la definición base de Patient, el Bundle la trae; localiza `fhirVersion` y `status`.
   Qué esperar: comprobar que hasta las definiciones del estándar son recursos consultables. Si llega `total: 0`, también es hallazgo válido: ese servidor no expone las definiciones base como instancias.

4. Consulta: `Subscription?_count=3`
   Qué observar: si hay instancias, el campo `criteria` contiene una cadena de búsqueda.
   Qué esperar: reconocer el modelo criteria-based de R4 (el que R5 rediseñó a topic-based y el Backport IG permite modernizar sin salir de R4).

5. Consulta: `ValueSet?_count=2`
   Qué observar: recursos ValueSet con su `url` canónica y su `compose`.
   Qué esperar: la materia prima de `$expand` y de los binding strengths (required/extensible/preferred/example).

## En la PC

Con el entorno del [Setup](/setup):

```powershell
curl -s "https://hapi.fhir.org/baseR4/metadata?_summary=true" -H "Accept: application/fhir+json"
```

Salida esperada (fragmento): `"resourceType": "CapabilityStatement"` y `"fhirVersion": "4.0.1"`.

Verifica lo mismo con Python:

```powershell
python -c "import urllib.request, json; r = json.load(urllib.request.urlopen('https://hapi.fhir.org/baseR4/metadata?_summary=true')); print(r['fhirVersion'], r['status'])"
```

Salida esperada: `4.0.1 active`.

## Retos

1. Abre `https://hl7.org/fhir/us/core/` y localiza el perfil US Core Patient. Éxito: nombras dos elementos marcados must-support y explicas por qué eso no los hace obligatorios.
2. Abre `https://www.hl7.org/fhir/uv/ips/` y encuentra qué recurso actúa como índice del documento IPS. Éxito: respondes Composition y sabes que viaja en un Bundle tipo document.
3. En `https://registry.fhir.org/` busca "subscriptions backport". Éxito: identificas el IG oficial y sobre qué versiones de FHIR se aplica (R4/R4B).
4. Escribe los scopes SMART v2 mínimos para: (a) una app de paciente que lee y busca sus signos vitales; (b) un proceso nocturno sin usuario que lee y busca pacientes. Éxito: `patient/Observation.rs?category=vital-signs` y `system/Patient.rs`, con justificación de mínimo privilegio.
5. En `https://www.hl7.org/certification/fhir.cfm` verifica el nombre exacto del examen de entrada y el requisito del Advanced Developer. Éxito: citas "Foundational Implementer" y que el Advanced exige tenerlo vigente.
6. Redacta la tabla de decisión de versión para tres casos: proyecto nacional 2026, laboratorio que sigue la evolución del estándar, sistema que necesita subscriptions modernas. Éxito: R4; R5/build de R6; R4 + Subscriptions R5 Backport IG, con una frase de justificación cada uno.

## Reto Feynman

Explica a un colega no técnico, en 4-6 líneas: (1) por qué "todos usan la versión 4" de FHIR aunque ya existan la 5 y pronto la 6 (la regulación y las guías arrastran la adopción, no la novedad técnica), y (2) qué es una guía de implementación usando la imagen de idioma y dialecto. Sin siglas sin explicar.

## Criterio de completado

- [ ] Comprobé `fhirVersion 4.0.1` en HAPI desde el Laboratorio y desde curl/Python.
- [ ] Distingo las tres URL: `hl7.org/fhir/R4/`, `hl7.org/fhir/` y `build.fhir.org`.
- [ ] Escribo scopes v2 con verbos granulares y parámetro embebido sin mirar la chuleta.
- [ ] Localicé US Core, IPS y el Subscriptions Backport en sus sitios oficiales.
- [ ] Explico transaction vs batch y must-support vs obligatorio sin dudar.
- [ ] Completé el Reto Feynman por escrito.
