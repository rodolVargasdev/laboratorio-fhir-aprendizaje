# Practica

## Objetivo

Validar recursos reales con `$validate` y con el validador oficial Java, leer OperationOutcomes con criterio (severity, code, expression), inspeccionar StructureDefinitions (differential vs snapshot, slicing) y dar los primeros pasos de autoría con FSH.

## En el navegador (Laboratorio)

Contra `https://hapi.fhir.org/baseR4`; escribe solo el path.

1. **El contrato del servidor.** Consulta:
   `metadata?_summary=true`
   Qué observar: `kind` (instance), `fhirVersion`, y en `rest.resource` las `interaction` y `searchParam` de Patient. Respuesta esperada: un CapabilityStatement — el documento que deberías leer antes de programar contra cualquier servidor.

2. **Leer una StructureDefinition base.** Consulta:
   `StructureDefinition?url=http://hl7.org/fhir/StructureDefinition/Patient&_elements=url,kind,abstract,type,baseDefinition,derivation`
   Respuesta esperada: `kind: resource`, `derivation: specialization`, `baseDefinition` apuntando a DomainResource. Compárala mentalmente con un perfil (derivation constraint).

3. **Buscar perfiles publicados.** Consulta:
   `StructureDefinition?derivation=constraint&type=Patient&_count=5&_elements=url,name,baseDefinition`
   Qué observar: perfiles de Patient subidos por la comunidad; cada `baseDefinition` muestra el eslabón anterior de la cadena. Respuesta esperada: varias canónicas distintas de la base.

4. **Conformidad afirmada.** Consulta:
   `Patient?_profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient&_count=3`
   Respuesta esperada: pacientes cuyo `meta.profile` **afirma** US Core (puede haber cero). Punto clave: esto no prueba que lo cumplan — es claimed, no validated.

5. **Observa un OperationOutcome real.** Pide un recurso inexistente:
   `Patient/no-existe-xyz`
   Respuesta esperada: HTTP 404 con un OperationOutcome (`issue.code: not-found` o similar). Identifica severity, code y diagnostics: es la misma estructura que devuelve la validación.

6. **Differential vs snapshot en vivo.** Consulta:
   `StructureDefinition?type=Observation&derivation=constraint&_count=1`
   Abre el recurso devuelto y compara el tamaño de `differential.element` con el de `snapshot.element` (si el autor lo subió). Qué observar: el differential lista solo los paths tocados; el snapshot repite TODOS los elementos de Observation con las restricciones fusionadas. Respuesta esperada: entiendes por qué un validador no puede trabajar solo con el differential.

## En la PC

Requiere [Setup](/setup) con Java 17+ para el validador.

1. **$validate con recurso inválido (curl).** Guarda como `obs-mala.json` una Observation SIN `status` y con `valueQuantity` + `dataAbsentReason` a la vez. Ejecuta:

```bash
curl -s -X POST "https://hapi.fhir.org/baseR4/Observation/\$validate" \
  -H "Content-Type: application/fhir+json" -d @obs-mala.json
```

Salida esperada: HTTP 200 (la validación corrió) con OperationOutcome que contiene al menos dos issues `error`: uno `required` sobre `Observation.status` y uno de invariante (obs-6). Anota las `expression`: son tu mapa de corrección. Corrige el archivo y repite hasta que solo queden warnings/information.

2. **Validador oficial Java.** Descarga `validator_cli.jar` (enlace en la guía oficial del validador) y ejecuta:

```bash
java -jar validator_cli.jar obs-mala.json -version 4.0.1
```

Salida esperada: mismo tipo de hallazgos, con formato `Error @ Observation.status ...`. Luego valida contra un perfil de US Core:

```bash
java -jar validator_cli.jar paciente.json -version 4.0.1 \
  -ig hl7.fhir.us.core#7.0.0 \
  -profile http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

Salida esperada: errores nuevos que la base no exigía (identifier, name, gender según el perfil): acabas de ver la diferencia entre válido-base y conforme-a-perfil.

3. **Primer perfil en FSH.** Instala SUSHI (`npm install -g fsh-sushi`), crea un proyecto (`sushi init`) y define en `input/fsh/paciente.fsh`:

```
Profile: PacienteNacional
Parent: Patient
Id: sv-paciente
* identifier 1..* MS
* gender 1..1
```

Ejecuta `sushi .`. Salida esperada: `fsh-generated/resources/StructureDefinition-sv-paciente.json` con `derivation: constraint` y tu differential. Valida un paciente sin identifier contra él con el validador (`-ig ./fsh-generated -profile .../sv-paciente`) y observa el error `required`.

## Retos

1. Provoca y clasifica 4 issues distintos (structure, required, code-invalid, invariant) con recursos deliberadamente rotos vía `$validate`. Éxito: identificas el `code` de cada issue sin mirar la lección.
2. Diferencia 200-con-errores de 400/422: envía la Observation inválida a `POST /Observation` (create real) y compara con `$validate`. Éxito: explicas por qué los códigos HTTP difieren.
3. Descarga la StructureDefinition de us-core-patient (de hl7.org/fhir/us/core) y localiza en su JSON: un mustSupport, un binding y el slicing de identifier o telecom. Éxito: señalas differential vs snapshot del mismo elemento.
4. Amplía tu perfil FSH con el slice del DUI (discriminator value sobre system, slice 1..1 con fixedUri). Éxito: SUSHI compila y el validador rechaza pacientes sin DUI.
5. Añade a tu perfil una invariante FHIRPath (`name.exists() implies name.family.exists() or name.given.exists()`) con severity error. Éxito: una instancia con `name` vacío la dispara.
6. Escribe el CapabilityStatement `kind: requirements` mínimo de un actor "registro nacional de pacientes": interactions y searchParams exigidos para Patient. Éxito: otro compañero podría implementar contra él sin preguntarte nada.

## Reto Feynman

Explica a un gerente de proyecto, sin jerga: por qué "el proveedor dice que ya es compatible con FHIR" no significa nada verificable hasta que hay un perfil publicado y un validador que su sistema pasa, y qué papel juegan el IG y el banco de pruebas en el contrato. Máximo 8 frases.

## Criterio de completado

- [ ] Ejecuté los 6 ejercicios de Laboratorio y sé leer un CapabilityStatement.
- [ ] Validé recursos con $validate y con validator_cli.jar, y corregí usando expression.
- [ ] Distingo differential/snapshot, fixed/pattern y claimed/validated con ejemplos propios.
- [ ] Compilé un perfil FSH con SUSHI y validé instancias contra él.
- [ ] Construí un slicing con discriminator y una invariante FHIRPath que funcionan.
- [ ] Completé al menos 4 de los 6 retos y el Reto Feynman.
