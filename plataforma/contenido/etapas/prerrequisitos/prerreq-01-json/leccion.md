# JSON a fondo

> **En simple:** JSON es una forma de escribir datos como texto plano para que dos programas se entiendan sin ambigüedad. Piensa en un formulario clínico con casillas etiquetadas: cada casilla tiene un nombre ("apellido", "fecha de nacimiento") y un contenido. JSON es ese formulario, pero escrito con reglas tan estrictas que una computadora nunca duda de qué va en cada casilla. FHIR, el estándar con el que vas a trabajar los próximos meses, habla JSON casi todo el tiempo: dominarlo aquí te ahorra dolores en todo lo que viene.

## Qué es JSON y por qué las APIs modernas lo hablan

JSON significa *JavaScript Object Notation*. Nació dentro del lenguaje JavaScript, pero hoy es un formato independiente: cualquier lenguaje (Python, Java, C#, SQL moderno) sabe leerlo y escribirlo. Es un **formato de intercambio de datos**: su único trabajo es transportar información estructurada de un sistema a otro como texto.

¿Por qué ganó? Tres razones prácticas:

1. **Es liviano.** Comparado con XML (su predecesor en salud, que sigue vivo en HL7 v3 y CDA), JSON transporta lo mismo con menos caracteres. Menos bytes en la red, respuestas más rápidas.
2. **Es legible por humanos.** Puedes abrir una respuesta de un servidor FHIR y entenderla sin herramientas especiales. Eso acelera la depuración, que será gran parte de tu trabajo como responsable de interoperabilidad.
3. **Mapea directo a las estructuras de los lenguajes.** Un objeto JSON se convierte en un diccionario de Python o un objeto de JavaScript sin traducción dolorosa. Con XML esa traducción siempre fue incómoda.

Por eso las APIs REST modernas —incluida la API REST de FHIR— usan JSON como formato principal. Cuando en unas semanas le pidas un paciente a un servidor con `GET /Patient/123`, lo que recibirás es un documento JSON.

Un punto importante desde ya: JSON **no** es JavaScript. Es solo una notación de datos. No puede contener código, funciones ni cálculos. Solo datos.

## Los seis tipos de valor

Todo lo que puede aparecer como valor en JSON pertenece a exactamente **seis tipos**. No hay más. Si memorizas esta lista, ya conoces el 50 % del formato:

| Tipo | Ejemplo | Notas |
|---|---|---|
| `string` (texto) | `"Carmen"` | Siempre entre **comillas dobles**. Nunca simples. |
| `number` (número) | `37.5`, `120`, `-3` | Sin comillas. Punto decimal (nunca coma). No existe distinción entre entero y decimal. |
| `boolean` | `true`, `false` | Sin comillas y en minúsculas. |
| `null` | `null` | Representa "valor vacío a propósito". Sin comillas. |
| `object` (objeto) | `{ "clave": valor }` | Colección de pares clave-valor entre llaves. |
| `array` (lista) | `[ valor, valor ]` | Secuencia ordenada entre corchetes. |

Detalles que distinguen a quien domina JSON de quien lo conoce de oídas:

- `"37.5"` (con comillas) es un **string**, no un número. Un sistema que reciba `"temperatura": "37.5"` no puede sumarla ni compararla numéricamente sin convertirla primero. En FHIR este matiz importa: `birthDate` es string (`"1988-04-12"`), pero `valueQuantity.value` es number.
- `true` no es lo mismo que `"true"`. El primero es booleano; el segundo es un texto de cuatro letras. FHIR usa el booleano real: `"active": true`.
- Los números no llevan ceros a la izquierda (`007` es inválido; `7` es válido) y no aceptan `NaN` ni `Infinity`.

## Objetos: el formulario con casillas

Un **objeto** agrupa pares `"clave": valor` entre llaves `{ }`. Es la ficha del paciente: cada casilla tiene etiqueta y contenido.

```json
{
  "nombre": "Carmen Ramírez",
  "edad": 37,
  "asegurada": true,
  "expediente": "EXP-2024-0451"
}
```

Reglas de los objetos, todas obligatorias:

- La **clave siempre es un string entre comillas dobles**. `nombre: "Carmen"` (sin comillas en la clave) es válido en JavaScript, pero **inválido en JSON**. Esta es la confusión más frecuente entre ambos.
- Clave y valor se separan con dos puntos `:`.
- Los pares se separan con comas, **pero el último par no lleva coma**. Una coma después del último elemento (llamada "coma final" o *trailing comma*) invalida el documento completo.
- Las claves distinguen mayúsculas de minúsculas: `"birthDate"` y `"birthdate"` son claves distintas. FHIR usa *camelCase* (`birthDate`, `resourceType`) y un servidor rechazará o ignorará la variante mal escrita.
- El orden de las claves **no tiene significado**. `{"a": 1, "b": 2}` y `{"b": 2, "a": 1}` representan el mismo dato.
- No se permiten claves duplicadas en la práctica (el estándar lo tolera, pero el comportamiento es impredecible: casi todos los parsers se quedan con la última).

Y una regla que sorprende: **JSON no admite comentarios**. No existe `//` ni `/* */` ni `#`. Si necesitas anotar algo, va fuera del documento o en un campo de datos (FHIR tiene campos como `note` justamente para eso).

## Arrays: listas ordenadas que empiezan en cero

Un **array** es una secuencia ordenada de valores entre corchetes `[ ]`, separados por comas:

```json
{
  "alergias": ["penicilina", "sulfas"],
  "presionesArteriales": [120, 118, 125]
}
```

Tres propiedades clave:

1. **El orden importa.** A diferencia de las claves de un objeto, la posición de cada elemento es significativa. En FHIR, el primer elemento de una lista suele ser el preferente.
2. **Se indexa desde 0.** El primer elemento es `[0]`, el segundo `[1]`. `alergias[0]` es `"penicilina"`. Esto no es un capricho: casi todos los lenguajes de programación cuentan así, y las rutas de FHIR también.
3. **Puede contener cualquier tipo**, incluidos objetos y otros arrays. Aquí está el patrón más importante para ti: el **array de objetos**.

```json
{
  "contactos": [
    { "nombre": "Elena Ramírez", "parentesco": "madre", "telefono": "7012-0001" },
    { "nombre": "José Ramírez", "parentesco": "padre", "telefono": "7012-0002" }
  ]
}
```

FHIR está lleno de este patrón. Un paciente puede tener varios nombres (el oficial, el de uso cotidiano), varios teléfonos, varias direcciones: cada uno es un objeto dentro de un array. Cuando veas `"name": [ { ... }, { ... } ]`, lee: "name es una lista, y cada elemento es una ficha completa de nombre".

## Anidación y rutas: cómo llegar a un dato enterrado

Los objetos y arrays se combinan sin límite de profundidad: un objeto que contiene un array de objetos que contienen arrays... Para no perderte, se usan **rutas**: la secuencia de claves e índices que lleva desde la raíz hasta el dato.

Este es un recurso **Patient de FHIR real y recortado**, como el que devuelve el servidor de pruebas `https://hapi.fhir.org/baseR4`:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo-sv-001",
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Ramírez López",
      "given": ["Carmen", "Elena"]
    },
    {
      "use": "usual",
      "given": ["Carmencita"]
    }
  ],
  "gender": "female",
  "birthDate": "1988-04-12",
  "telecom": [
    { "system": "phone", "value": "+503 7012-3456", "use": "mobile" }
  ]
}
```

Léelo por capas: la raíz es un objeto; `name` es un array con dos objetos (el nombre oficial y el nombre de uso cotidiano); dentro de cada uno, `given` es un array de strings (los nombres de pila, en orden).

Ahora las rutas. La notación `Patient.name[0].given[0]` se lee de izquierda a derecha, un salto por cada punto o índice:

| Ruta | Resultado | Cómo se lee |
|---|---|---|
| `Patient.id` | `"ejemplo-sv-001"` | El campo `id` de la raíz. |
| `Patient.name[0].family` | `"Ramírez López"` | Primer nombre de la lista, su apellido. |
| `Patient.name[0].given[0]` | `"Carmen"` | Primer nombre de la lista, primer nombre de pila. |
| `Patient.name[0].given[1]` | `"Elena"` | Primer nombre de la lista, segundo nombre de pila. |
| `Patient.name[1].given[0]` | `"Carmencita"` | Segundo nombre de la lista (el de uso), su nombre de pila. |
| `Patient.telecom[0].value` | `"+503 7012-3456"` | Primer contacto, su valor. |

Fíjate en `name[1].family`: **no existe**. El segundo objeto de `name` no tiene la clave `family`. Intentar leerla no da error de sintaxis; simplemente no hay nada ahí. Ese "no hay nada" nos lleva a la distinción más importante del tema.

## null no es lo mismo que campo ausente

En JSON hay tres situaciones que un principiante confunde y un experto distingue siempre:

```json
{ "segundoNombre": "Elena" }
```
El campo existe y tiene valor.

```json
{ "segundoNombre": null }
```
El campo **existe** y su valor es "vacío a propósito". Alguien escribió deliberadamente que ahí no hay dato.

```json
{ }
```
El campo **no existe**. Nadie dijo nada sobre él.

¿Por qué importa? Porque significan cosas distintas. "El paciente no tiene alergias registradas" (campo ausente: no sabemos) no es lo mismo que "se verificó y no tiene alergias" (eso en FHIR se modela con un dato explícito, no con null). Confundirlos en un sistema de salud tiene consecuencias clínicas reales.

**La regla de FHIR, que debes grabarte desde hoy:** en FHIR un campo ausente significa "no se registró" o "no aplica", y **casi nunca se usa `null`**. La especificación FHIR prohíbe enviar propiedades con valor `null` en sus recursos JSON (con una única excepción técnica avanzada, en arrays con extensiones, que verás mucho más adelante). Si un dato no existe, el campo **se omite por completo**. Un recurso con `"birthDate": null` es un recurso FHIR inválido; lo correcto es que `birthDate` no aparezca.

Consecuencia práctica: cuando programes contra un servidor FHIR, nunca asumas que un campo estará presente. Tu código debe preguntar "¿existe `name`? ¿tiene al menos un elemento? ¿ese elemento tiene `given`?" antes de leer `name[0].given[0]`.

## JSON frente a XML: el mismo paciente, dos formatos

FHIR acepta ambos formatos, y en instituciones de salud encontrarás XML en sistemas heredados (CDA, HL7 v3). Compara el mismo dato:

**JSON:**

```json
{
  "resourceType": "Patient",
  "name": [
    { "family": "Ramírez López", "given": ["Carmen"] }
  ],
  "birthDate": "1988-04-12"
}
```

**XML:**

```xml
<Patient xmlns="http://hl7.org/fhir">
  <name>
    <family value="Ramírez López"/>
    <given value="Carmen"/>
  </name>
  <birthDate value="1988-04-12"/>
</Patient>
```

Observaciones:

- XML usa etiquetas de apertura y cierre (`<name>...</name>`); JSON usa llaves y corchetes. XML repite cada nombre de etiqueta dos veces: más verboso.
- En XML de FHIR los valores primitivos van en el atributo `value`; en JSON van directo. 
- JSON declara los tipos con su sintaxis (`true` es booleano, `37` es número); en XML todo es texto y el tipo depende del esquema.
- XML tiene *namespaces* (`xmlns=...`), comentarios y atributos; JSON no tiene ninguno de los tres: es más simple a propósito.

Para tu carrera: lee ambos, escribe JSON. Los ejemplos de la documentación oficial de FHIR, los servidores de prueba y las herramientas modernas asumen JSON por defecto.

## Cómo validar: nunca confíes en tus ojos

Un solo carácter fuera de lugar invalida el documento entero. JSON no se degrada con elegancia: o es 100 % válido o el receptor lo rechaza completo. Por eso jamás se valida "a ojo". Tus tres herramientas:

1. **jsonlint.com.** Pegas el texto, pulsas *Validate JSON* y te dice `Valid JSON` o te señala la línea del error. Ideal mientras aprendes, porque los mensajes son claros.
2. **El editor de esta plataforma.** Valida mientras escribes en los ejercicios de práctica.
3. **VS Code.** Guarda el archivo con extensión `.json` y el editor subraya los errores en rojo en tiempo real, además de formatear con `Shift+Alt+F`. Será tu herramienta diaria cuando trabajes con recursos FHIR grandes.

Truco de lectura de errores: los validadores suelen señalar el punto donde el parser *se dio cuenta* del problema, que puede estar una línea después del error real (por ejemplo, una coma faltante se detecta al encontrar la clave siguiente). Si el mensaje no tiene sentido en esa línea, mira la anterior.

## Errores comunes

Los cinco que cometen todos, con su diagnóstico:

**1. Coma final (trailing comma).**

```json
{ "nombre": "Carmen", "edad": 37, }
```
La coma después de `37` es inválida. Los validadores dicen algo como `Expecting 'STRING', got '}'`. Muy traicionero porque JavaScript y Python la toleran en su propio código.

**2. Comillas simples.**

```json
{ 'nombre': 'Carmen' }
```
Inválido. JSON exige comillas dobles en claves y strings, sin excepción. Frecuente al copiar código Python.

**3. Clave sin comillas.**

```json
{ nombre: "Carmen" }
```
Válido como objeto de JavaScript, inválido como JSON. Toda clave lleva comillas dobles.

**4. Llaves o corchetes desbalanceados.**

Cada `{` necesita su `}` y cada `[` su `]`, en el orden correcto. En documentos anidados es el error más difícil de ver a ojo; el formateo con sangría (o `Shift+Alt+F` en VS Code) lo delata de inmediato: si la sangría "no cierra" donde esperas, falta un símbolo.

**5. Coma faltante entre elementos.**

```json
{ "nombre": "Carmen" "edad": 37 }
```
Falta la coma entre los dos pares. El validador se queja en `"edad"` aunque el problema nació antes.

Mención extra: escribir `True`, `FALSE` o `Null` con mayúsculas (deben ser `true`, `false`, `null` exactos) y usar coma decimal (`37,5`) en lugar de punto (`37.5`).

## Nivel siguiente

Lo que dominas ahora es la sintaxis. En los próximos temas se apoya todo esto:

- **JSON Schema.** Un lenguaje para describir *qué estructura debe tener* un JSON válido (qué campos son obligatorios, de qué tipo). FHIR publica esquemas de todos sus recursos; los validadores FHIR los usan por debajo.
- **`application/fhir+json`.** Cuando hables con servidores FHIR verás este *media type* en las cabeceras HTTP. Es JSON, pero declarado como "JSON con las reglas de FHIR": el servidor promete y exige recursos FHIR válidos, no JSON cualquiera.
- **Números grandes y precisión decimal.** JSON no fija cuántos dígitos soporta un número; cada lenguaje lo interpreta con sus límites. Con decimales clínicos (dosis, resultados de laboratorio) los parsers pueden redondear: `0.1 + 0.2` no da exactamente `0.3` en la mayoría de lenguajes. FHIR es consciente de esto y su tipo `decimal` pide preservar la precisión original; algunos sistemas transportan cantidades críticas como string por esa razón.
- **Minificación.** Los servidores suelen enviar JSON sin espacios ni saltos de línea (una sola línea gigante) para ahorrar bytes. Es el mismo dato: un formateador lo vuelve legible.

## Chuleta

| Concepto | Regla | Ejemplo válido | Inválido |
|---|---|---|---|
| String | Comillas dobles siempre | `"Carmen"` | `'Carmen'` |
| Number | Sin comillas, punto decimal | `37.5` | `37,5` / `"37.5"` como número |
| Boolean | Minúsculas exactas | `true` | `True` |
| null | Vacío intencional | `null` | `NULL`, `None` |
| Objeto | `{ "clave": valor }`, claves con comillas | `{ "id": 1 }` | `{ id: 1 }` |
| Array | `[ ]`, indexado desde 0, orden significativo | `["a", "b"]` | — |
| Comas | Entre elementos, nunca al final | `[1, 2, 3]` | `[1, 2, 3,]` |
| Comentarios | No existen en JSON | — | `// nota` |
| Ruta con índice | `campo[n].subcampo`, n desde 0 | `name[0].given[0]` | — |
| null vs ausente | Ausente = no se registró; en FHIR no se envía `null` | omitir el campo | `"birthDate": null` |
| Validación | jsonlint.com, editor de la app, VS Code | — | validar "a ojo" |

## Autoevaluacion

Responde sin mirar la lección; al final están las respuestas.

1. Nombra los seis tipos de valor de JSON.
2. ¿Es válido este JSON? ¿Por qué? `{ "activo": True }`
3. En el Patient de la lección, ¿qué devuelve `Patient.name[1].given[0]`?
4. ¿Qué diferencia hay entre `{ "telefono": null }` y `{ }` si hablamos del teléfono de un paciente?
5. En un recurso FHIR, ¿cómo se representa correctamente que no se conoce la fecha de nacimiento?
6. Encuentra el error: `{ "alergias": ["penicilina", "sulfas",] }`
7. ¿Por qué `"edad": "37"` puede causar problemas aunque el JSON sea sintácticamente válido?
8. Menciona dos ventajas de JSON sobre XML para una API de salud.

### Respuestas

1. String, number, boolean, null, object y array.
2. Inválido: los booleanos se escriben en minúsculas exactas, `true`.
3. `"Carmencita"`: segundo objeto del array `name` (índice 1), primer elemento de su array `given` (índice 0).
4. En el primero el campo existe con valor vacío deliberado ("se afirmó que no hay"); en el segundo el campo no existe ("no se registró nada"). Son afirmaciones distintas sobre el dato.
5. Omitiendo por completo el campo `birthDate`. FHIR prohíbe `"birthDate": null`.
6. Coma final después de `"sulfas"`: el último elemento de un array nunca lleva coma.
7. Porque `"37"` es un string, no un número: el sistema receptor no puede operar numéricamente (comparar, calcular edad pediátrica, etc.) sin convertirlo, y algunos lo rechazarán por tipo incorrecto.
8. Es menos verboso (menos bytes, respuestas más rápidas), declara tipos en su propia sintaxis y mapea directo a las estructuras de datos de los lenguajes modernos, lo que simplifica la programación.

## Para profundizar

- [JSON en MDN (español)](https://developer.mozilla.org/es/docs/Learn/JavaScript/Objects/JSON) — el mejor recorrido guiado en español, con ejercicios interactivos para practicar lectura de datos anidados.
- [json.org en español](https://www.json.org/json-es.html) — la especificación completa del formato en una sola página, con los diagramas de sintaxis oficiales; léela una vez y entenderás que JSON entero cabe en cinco diagramas.
- [jsonlint.com](https://jsonlint.com) — el validador que usarás en toda la práctica de este tema; guárdalo en favoritos.
- [Servidor FHIR de pruebas HAPI (baseR4)](https://hapi.fhir.org/baseR4) — abre `https://hapi.fhir.org/baseR4/Patient?_count=1` en el navegador y verás JSON de FHIR real; todavía no entenderás todo, y está bien: reconocerás objetos, arrays y rutas.
