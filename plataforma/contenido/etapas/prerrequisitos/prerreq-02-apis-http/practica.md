# Practica

## Objetivo

Hacer tus primeras peticiones HTTP reales contra un servidor FHIR público y aprender a leer las tres capas de toda respuesta: el código de estado, los headers y el cuerpo JSON. Al terminar sabrás distinguir un éxito de un error del cliente, y habrás visto un CapabilityStatement, un Bundle y un OperationOutcome de verdad.

## Ejercicios guiados

Todos los ejercicios del Laboratorio hacen GET contra la base `https://hapi.fhir.org/baseR4`. Tú escribes solo el **path** (lo que va después de la base). HAPI es un servidor público de pruebas: los datos son ficticios y a veces caóticos; eso es parte del aprendizaje.

1. **El saludo: pide el CapabilityStatement.**
   En el Laboratorio escribe exactamente:
   ```
   metadata
   ```
   Resultado esperado: código de estado **200**, header `Content-Type` con `application/fhir+json`, y un cuerpo cuyo primer campo relevante es `"resourceType": "CapabilityStatement"`. Localiza dentro del JSON el campo `fhirVersion` (debe empezar con `4.`) y, en la sección `rest`, la lista de recursos que el servidor soporta. Acabas de leer el "menú" del servidor.

2. **Tu primera búsqueda: dos pacientes cualesquiera.**
   ```
   Patient?_count=2
   ```
   Resultado esperado: **200**, y en el cuerpo `"resourceType": "Bundle"` (no `Patient`). Un Bundle es un contenedor de resultados. Observa: el campo `total` (cuántos pacientes hay en el servidor en total) y el arreglo `entry` con exactamente 2 elementos; dentro de cada `entry.resource` verás `"resourceType": "Patient"`. Nota cómo `_count=2` limitó los resultados devueltos, no el `total`.

3. **Búsqueda con dos parámetros.**
   ```
   Patient?name=garcia&_count=3
   ```
   Resultado esperado: **200** y un Bundle con hasta 3 entradas cuyos nombres contienen "garcia" (revisa `entry[n].resource.name`). Fíjate en la sintaxis del path: `?` introduce el primer parámetro y `&` une el segundo. Cambia `garcia` por otro apellido y repite: la query string es tu formulario de búsqueda.

4. **Provoca un 404 y léelo con calma.**
   ```
   Patient/no-existe-999
   ```
   Resultado esperado: código **404**. El cuerpo NO está vacío: es un `"resourceType": "OperationOutcome"`, el recurso con que FHIR explica los errores. Dentro de `issue[0]` localiza `severity` (normalmente `error`) y el texto de diagnóstico que dice que ese Patient no se encontró. Conclusión que debes verbalizar: el servidor funcionó perfectamente; lo que no existe es el recurso.

5. **El mismo GET desde el navegador.**
   Abre en una pestaña nueva:
   ```
   https://hapi.fhir.org/baseR4/metadata
   ```
   Resultado esperado: el mismo CapabilityStatement del ejercicio 1 (el navegador ejecutó un GET al presionar Enter; puede mostrarse como texto plano o JSON coloreado según el navegador). Limitación a notar: desde la barra de direcciones solo puedes hacer GET; no hay forma de elegir método, headers ni cuerpo. Por eso existen curl y el Laboratorio.

## En la PC

El mismo GET con curl desde tu terminal (si te falta curl, revisa [Setup](/setup)):

```bash
curl -H "Accept: application/fhir+json" "https://hapi.fhir.org/baseR4/Patient?_count=1"
```

Salida esperada: un bloque JSON que empieza con `{"resourceType":"Bundle"` y contiene una entrada `Patient`. El flag `-H` agrega el header `Accept`; las comillas alrededor de la URL evitan que la terminal malinterprete el `&`. Agrega `-i` al comando para ver también la línea de estado (`HTTP/2 200`) y los headers de la respuesta.

## Retos

1. Consigue un Bundle de pacientes donde `total` sea mayor que 0 usando un apellido distinto de garcia. Criterio de éxito: `total > 0` y al menos una `entry`.
2. Encuentra el path que devuelve exactamente 5 observaciones clínicas. Criterio de éxito: un Bundle con 5 entradas cuyo `resource.resourceType` sea `Observation` (pista: mismo patrón que con Patient).
3. Copia el `id` de un paciente real de cualquier búsqueda anterior y pídelo directo con `Patient/<id>`. Criterio de éxito: 200 y un cuerpo cuyo `resourceType` es `Patient` (no Bundle) con ese mismo `id`.
4. Provoca un 404 de RUTA (no de id): pide un tipo de recurso que no existe, como `Paciente?_count=1`. Criterio de éxito: 4xx con un OperationOutcome que menciona que el tipo de recurso es desconocido. Explica en una frase en qué se diferencia este 404 del ejercicio 4.
5. Con curl y el flag `-i`, captura la línea de estado y el header `Content-Type` de `metadata`. Criterio de éxito: ves `200` y un `Content-Type` que contiene `fhir`.
6. Combina tres parámetros en una sola búsqueda: `Patient?name=garcia&gender=female&_count=2`. Criterio de éxito: 200 con un Bundle; verifica que cada resultado cumpla ambos filtros.

## Reto Feynman

Explica por escrito, en 4 a 6 líneas y sin tecnicismos, como si hablaras con la directora del hospital:

1. Qué es una API y por qué permite que dos sistemas de salud hechos por empresas distintas intercambien pacientes.
2. Por qué un 404 no significa "el sistema falló", y por qué eso importa cuando el personal reporta "errores".

Si necesitas más de 6 líneas o recurres a jerga (endpoint, request, parsear), vuelve a la lección y reintenta.

## Criterio de completado

- [ ] Ejecuté `metadata` en el Laboratorio y encontré `fhirVersion` en el CapabilityStatement.
- [ ] Obtuve un Bundle con `Patient?_count=2` y entiendo la diferencia entre `total` y las entradas devueltas.
- [ ] Hice una búsqueda con dos o más parámetros unidos por `&`.
- [ ] Provoqué un 404 y leí el OperationOutcome sin interpretarlo como caída del sistema.
- [ ] Abrí `metadata` en el navegador y sé por qué el navegador solo sirve para GET.
- [ ] Ejecuté el GET con curl y reconocí la línea de estado con `-i`.
- [ ] Completé al menos 4 de los 6 retos.
- [ ] Escribí el Reto Feynman sin jerga técnica.
