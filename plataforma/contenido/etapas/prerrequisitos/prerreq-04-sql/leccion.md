# SQL: pensar en tablas

> **En simple:** una base de datos relacional es un archivero de expedientes muy ordenado: cada gaveta es una tabla, cada ficha es una fila, y las fichas se cruzan entre sí con números de expediente. SQL es el idioma con el que le pides cosas al archivero: "tráeme las fichas de pacientes de Soyapango, ordenadas por edad, solo las tres primeras". Si aprendes a pedir con precisión, cualquier dato clínico está a una consulta de distancia.

## Por qué SQL es prerrequisito de FHIR

Casi todo servidor FHIR serio (HAPI FHIR, Google Cloud Healthcare API, Azure FHIR) guarda sus recursos, por debajo, en una base de datos relacional o en algo que se le parece mucho. Cuando dirijas un proyecto de interoperabilidad vas a convivir con dos mundos: el hospital que tiene su información en tablas SQL (el sistema de expedientes, el laboratorio, la farmacia) y el estándar FHIR que la expone como recursos. Para diseñar el puente entre ambos necesitas leer los dos idiomas.

Además, la forma de pensar es la misma: FHIR busca recursos con parámetros (`Patient?gender=female`), SQL filtra filas con condiciones (`WHERE genero = 'F'`). Quien domina una idea entiende la otra en minutos. Este tema te da la parte SQL; el paralelo con FHIR lo cerramos en la última sección.

## El modelo relacional: tablas, filas y columnas

Una base de datos relacional organiza la información en **tablas**. Una tabla tiene:

- **Columnas**: los campos que existen para todos los registros. Cada columna tiene nombre y tipo de dato (texto, número entero, fecha).
- **Filas**: los registros concretos. Una fila = un paciente, una consulta, un medicamento.

Durante todo el tema usaremos dos tablas de un mini sistema de salud:

Tabla `paciente`:

| id | nombre | apellido | fecha_nacimiento | genero | municipio |
|----|--------|----------|------------------|--------|-----------|
| 1 | Carlos | Ramirez | 1985-03-12 | M | San Salvador |
| 2 | Maria | Lopez | 1990-07-25 | F | Santa Ana |
| 3 | Jose | Hernandez | 1978-11-02 | M | Soyapango |

Tabla `consulta`:

| id | paciente_id | fecha | motivo | presion_sistolica |
|----|-------------|-------|--------|-------------------|
| 1 | 1 | 2026-01-10 | Control de hipertension | 145 |
| 3 | 2 | 2026-01-22 | Dolor de cabeza | 120 |
| 5 | 3 | 2026-04-18 | Control de diabetes | NULL |

El esquema completo, con 10 pacientes y 14 consultas listo para pegar en el navegador, está en la [práctica](#). No sigas leyendo sin tenerlo a mano mentalmente: todos los ejemplos de esta lección se ejecutan contra esos datos.

## Claves primarias y foráneas: cómo se cruzan las fichas

Cada fila necesita un identificador único e inmutable: la **clave primaria** (primary key). En nuestras tablas es la columna `id`. Dos pacientes pueden llamarse igual, nacer el mismo día y vivir en el mismo municipio, pero jamás compartirán `id`. Es el número de expediente del archivero.

Una **clave foránea** (foreign key) es una columna que guarda la clave primaria de otra tabla para señalarla. En `consulta`, la columna `paciente_id` apunta al `id` de `paciente`. La consulta 1 tiene `paciente_id = 1`: pertenece a Carlos Ramirez. Así se cruzan las fichas: la consulta no repite el nombre, apellido ni municipio del paciente; solo guarda su número.

### Por qué dos tablas y no una gigante

La tentación del principiante es una sola tabla con todo: nombre, apellido, municipio, fecha de consulta, motivo, presión... Veamos qué pasaría con Luis Flores, que tiene tres consultas:

| nombre | apellido | municipio | fecha | motivo |
|--------|----------|-----------|-------|--------|
| Luis | Flores | San Miguel | 2026-01-30 | Dolor lumbar |
| Luis | Flores | San Miguel | 2026-03-02 | Control de hipertension |
| Luis | Flores | San Miguel | 2026-05-11 | Control de hipertension |

Tres problemas concretos:

1. **Repetición**: los datos personales de Luis se copian tres veces. Con millones de consultas, eso es espacio desperdiciado y lentitud.
2. **Inconsistencia**: si Luis se muda a Usulután, hay que actualizar tres filas. Si el sistema actualiza dos y falla en la tercera, la base ahora se contradice a sí misma: ¿dónde vive Luis?
3. **Pérdida de datos**: si Luis todavía no tiene consultas, no hay fila donde ponerlo. El paciente desaparece de la base solo por no haberse enfermado.

La solución es separar: los datos que describen al paciente van una sola vez en `paciente`; cada evento clínico va en `consulta` con una referencia. A este proceso de eliminar repeticiones separando en tablas conectadas se le llama **normalización**. No necesitas memorizar sus formas normales todavía; basta con la regla práctica: *cada hecho se guarda una sola vez, en un solo lugar, y lo demás lo apunta*.

## SELECT: pedir exactamente lo que necesitas

La consulta fundamental tiene tres partes: qué columnas (`SELECT`), de qué tabla (`FROM`) y con qué condición (`WHERE`, opcional):

```sql
SELECT nombre, apellido, municipio
FROM paciente
WHERE municipio = 'San Salvador';
```

Sobre la lista de columnas:

- `SELECT nombre, apellido` trae solo esas columnas, en ese orden.
- `SELECT *` trae **todas** las columnas. Es cómodo para explorar, pero en sistemas reales es mala práctica: transfiere datos que no necesitas y tu código se rompe si alguien agrega columnas a la tabla. Regla: `*` para explorar, lista explícita para trabajar.
- Puedes renombrar una columna en el resultado con `AS`: `SELECT COUNT(*) AS total`.

Los textos van entre comillas simples (`'San Salvador'`); los números, sin comillas (`presion_sistolica > 140`). Las mayúsculas de las palabras clave (`SELECT`, `WHERE`) son convención, no obligación, pero facilitan leer la consulta de un vistazo.

## WHERE: el arte de filtrar filas

`WHERE` evalúa una condición fila por fila y solo deja pasar las que dan verdadero. Los operadores de comparación son los esperados: `=`, `!=` (o `<>`), `>`, `<`, `>=`, `<=`.

### Combinar condiciones: AND, OR, NOT

```sql
-- Mujeres de San Salvador
SELECT nombre, apellido FROM paciente
WHERE municipio = 'San Salvador' AND genero = 'F';

-- Pacientes de Santa Ana o de Soyapango
SELECT nombre, apellido FROM paciente
WHERE municipio = 'Santa Ana' OR municipio = 'Soyapango';

-- Todos menos los de San Salvador
SELECT nombre, apellido FROM paciente
WHERE NOT municipio = 'San Salvador';
```

`AND` exige que ambas condiciones se cumplan; `OR` se conforma con una. Cuando los mezclas, usa paréntesis para no depender de reglas de precedencia que nadie recuerda bajo presión: `WHERE (a OR b) AND c`.

### LIKE: buscar por patrón

`LIKE` compara texto contra un patrón con dos comodines: `%` significa "cero o más caracteres" y `_` significa "exactamente un carácter".

```sql
-- Apellidos que empiezan con R (Ramirez, Rivas)
SELECT apellido FROM paciente WHERE apellido LIKE 'R%';

-- Motivos que contienen la palabra hipertension
SELECT motivo FROM consulta WHERE motivo LIKE '%hipertension%';

-- Nombres de exactamente tres letras que terminan en na (Ana)
SELECT nombre FROM paciente WHERE nombre LIKE '_na';
```

### IN y BETWEEN: atajos legibles

`IN` reemplaza una cadena de `OR` sobre la misma columna; `BETWEEN` define un rango **inclusivo** en ambos extremos:

```sql
SELECT nombre FROM paciente
WHERE municipio IN ('Santa Ana', 'Soyapango', 'Mejicanos');

SELECT fecha, motivo FROM consulta
WHERE fecha BETWEEN '2026-01-01' AND '2026-02-28';
```

Con fechas guardadas como texto en formato `AAAA-MM-DD` (el estándar ISO 8601, el mismo que usa FHIR), la comparación alfabética coincide con la cronológica. Por eso ese formato no es capricho: es lo que hace que `BETWEEN` funcione con fechas en SQLite.

## ORDER BY y LIMIT: ordenar y recortar

El resultado de una consulta no tiene orden garantizado salvo que lo pidas:

```sql
-- Los 3 pacientes de mayor edad (fecha de nacimiento más antigua)
SELECT nombre, apellido, fecha_nacimiento
FROM paciente
ORDER BY fecha_nacimiento ASC
LIMIT 3;
```

- `ASC` es ascendente (de menor a mayor; es el valor por defecto y puede omitirse).
- `DESC` es descendente (de mayor a menor): `ORDER BY presion_sistolica DESC` pone primero las presiones más altas.
- Puedes ordenar por varias columnas: `ORDER BY municipio ASC, apellido ASC` ordena por municipio y, dentro de cada municipio, por apellido.
- `LIMIT n` recorta el resultado a las primeras `n` filas **después** de ordenar. Sin `ORDER BY`, `LIMIT` devuelve filas arbitrarias: casi siempre van juntos.

## Agregación: de filas individuales a resúmenes

Las funciones de agregación colapsan muchas filas en un solo valor:

| Función | Devuelve |
|---------|----------|
| `COUNT(*)` | Cuántas filas hay |
| `COUNT(columna)` | Cuántas filas tienen esa columna **no nula** |
| `SUM(columna)` | La suma de los valores |
| `AVG(columna)` | El promedio (ignora los NULL) |
| `MIN(columna)` / `MAX(columna)` | El menor y el mayor valor |

```sql
SELECT COUNT(*) AS total_consultas,
       AVG(presion_sistolica) AS presion_promedio,
       MAX(presion_sistolica) AS presion_maxima
FROM consulta;
```

### GROUP BY: un resumen por cada grupo

Sin `GROUP BY`, la agregación resume toda la tabla en una fila. Con `GROUP BY`, la tabla se parte en grupos y la función se calcula por grupo:

```sql
SELECT municipio, COUNT(*) AS total
FROM paciente
GROUP BY municipio
ORDER BY total DESC;
```

Esto devuelve una fila por municipio con su conteo de pacientes. Regla de oro: toda columna del `SELECT` que no esté dentro de una función de agregación debe aparecer en el `GROUP BY`.

Si quieres filtrar **grupos** (no filas), existe `HAVING`: `GROUP BY municipio HAVING COUNT(*) >= 2` deja solo los municipios con dos o más pacientes. `WHERE` filtra filas antes de agrupar; `HAVING` filtra grupos después de agrupar. Por ahora basta con reconocerlo cuando lo veas.

## JOIN: unir paciente y consulta

Separamos los datos en dos tablas; el `JOIN` los vuelve a juntar cuando hace falta. El diagrama mental: pon las dos tablas lado a lado y traza una línea de cada `paciente_id` de `consulta` hacia el `id` igual en `paciente`. Cada línea produce una fila combinada.

```sql
SELECT p.nombre, p.apellido, c.fecha, c.motivo
FROM paciente AS p
INNER JOIN consulta AS c ON c.paciente_id = p.id;
```

Piezas de la sintaxis:

- `AS p` y `AS c` son alias: apodos cortos para no escribir el nombre completo de la tabla cada vez.
- `ON c.paciente_id = p.id` es la condición de emparejamiento: dice qué clave foránea se conecta con qué clave primaria.
- El prefijo (`p.nombre`) aclara de qué tabla viene cada columna. Es obligatorio cuando ambas tablas tienen una columna con el mismo nombre (aquí, `id`).

`INNER JOIN` devuelve **solo las parejas que existen**. En nuestros datos, Elena Portillo no tiene consultas: ninguna línea llega a su ficha, así que no aparece en el resultado. Ni error ni aviso; simplemente no está. Este silencio es una fuente clásica de reportes incompletos en salud: "el informe de consultas por paciente" omite calladamente a todos los pacientes sin consultas.

Cuando necesitas conservar todas las filas de la tabla izquierda aunque no tengan pareja, existe `LEFT JOIN`: devuelve a Elena con las columnas de consulta en NULL. Lo usarás en un reto de la práctica; el estudio a fondo de los tipos de JOIN queda para más adelante.

## NULL: el valor que no es un valor

`NULL` significa **ausencia de dato**: no es cero, no es cadena vacía, no es falso. Es "no sabemos" o "no aplica". En nuestra tabla, tres consultas tienen `presion_sistolica` en NULL: en esas consultas nadie tomó la presión. Eso es muy distinto de una presión de 0.

Como NULL representa un desconocido, compararlo con cualquier cosa da desconocido, no verdadero. Por eso:

```sql
-- MAL: esto devuelve cero filas aunque haya NULL
SELECT * FROM consulta WHERE presion_sistolica = NULL;

-- BIEN: operador especial para nulos
SELECT * FROM consulta WHERE presion_sistolica IS NULL;

-- Y su inverso
SELECT * FROM consulta WHERE presion_sistolica IS NOT NULL;
```

Incluso `NULL = NULL` no da verdadero: dos desconocidos no se pueden declarar iguales. Consecuencias prácticas que te van a morder si las ignoras:

- `COUNT(presion_sistolica)` cuenta 11 en nuestra tabla; `COUNT(*)` cuenta 14. La diferencia son los 3 NULL.
- `AVG(presion_sistolica)` promedia solo los 11 valores presentes. Si trataras los NULL como cero, el promedio se desplomaría artificialmente: un error clínicamente peligroso.
- Un `WHERE presion_sistolica < 140` tampoco incluye los NULL: un desconocido no es menor que 140.

## SQL y FHIR: el mismo pensamiento con otra ropa

FHIR no es SQL, pero se piensa igual. Un recurso FHIR es como una fila muy rica en datos: en lugar de columnas planas tiene una estructura JSON con campos anidados, pero sigue siendo "un registro de un tipo". La referencia `Patient/123` que verás dentro de un recurso Encounter es exactamente una clave foránea: un puntero al identificador de otro registro. Y los parámetros de búsqueda de FHIR son el `WHERE` de la API.

| Concepto SQL | Equivalente FHIR | Ejemplo |
|--------------|------------------|---------|
| Tabla | Tipo de recurso | `paciente` ≈ `Patient` |
| Fila | Un recurso concreto | La fila id 1 ≈ `Patient/1` |
| Columna | Elemento del recurso | `fecha_nacimiento` ≈ `birthDate` |
| Clave primaria | `id` del recurso | `id = 3` ≈ `Patient/3` |
| Clave foránea | Referencia | `paciente_id` ≈ `subject: {"reference": "Patient/3"}` |
| `WHERE` | Parámetros de búsqueda | `WHERE genero = 'F'` ≈ `Patient?gender=female` |
| `JOIN` | `_include` / `_revinclude` | Traer la consulta con su paciente |
| `ORDER BY` | `_sort` | `Encounter?_sort=date` |
| `LIMIT` | `_count` | `Patient?_count=10` |
| `NULL` | Elemento ausente | Campo que no aparece en el JSON |

Cuando llegues a los temas de búsqueda FHIR, tradúcelos mentalmente a SQL y viceversa. Esa traducción bidireccional es la habilidad central de quien integra sistemas hospitalarios con FHIR: entender qué consulta SQL corre el sistema legado y qué búsqueda FHIR la reemplaza.

## Errores comunes

- Usar comillas dobles para texto. En SQL el texto va entre comillas simples: `'San Salvador'`. Las dobles son para nombres de columnas o tablas.
- Escribir `WHERE columna = NULL` y creer que la consulta "no encontró nada". Siempre `IS NULL` / `IS NOT NULL`.
- Confundir `WHERE` con `HAVING`: `WHERE` filtra filas antes de agrupar, `HAVING` filtra grupos ya agregados.
- Olvidar la condición `ON` del JOIN (o escribirla mal) y obtener el producto de todas las combinaciones posibles: 10 pacientes por 14 consultas = 140 filas sin sentido.
- Usar `SELECT *` en integraciones reales: cualquier cambio de esquema rompe o infla la interfaz.
- Asumir que `INNER JOIN` incluye a todos: los registros sin pareja desaparecen en silencio. Pregúntate siempre "¿quién falta en este resultado?".
- Guardar fechas en formatos como `12/03/1985`: pierdes el orden cronológico al comparar. Siempre `AAAA-MM-DD`.
- Poner en el `SELECT` columnas sin agregar que no están en el `GROUP BY`: en SQLite devuelve un valor arbitrario del grupo en lugar de fallar, lo que es peor porque el error pasa desapercibido.

## Nivel siguiente

Lo que sigue en el camino SQL, cuando este tema esté dominado:

- **Subconsultas**: una consulta dentro de otra, por ejemplo `WHERE paciente_id IN (SELECT id FROM paciente WHERE municipio = 'Soyapango')`. Permiten expresar preguntas en dos pasos.
- **Índices**: estructuras que aceleran las búsquedas sobre una columna, como el índice alfabético de un libro. Sin índices, el motor lee la tabla completa fila por fila; con millones de consultas médicas, la diferencia es de minutos a milisegundos.
- **Transacciones**: agrupar varios cambios para que se apliquen todos o ninguno. Si el sistema registra la consulta pero falla al descontar el medicamento del inventario, la transacción revierte todo. En salud, la atomicidad no es opcional.
- **Cómo lo usa FHIR por debajo**: HAPI FHIR, el servidor de referencia, guarda cada recurso en tablas relacionales (una tabla de recursos, tablas de índices de búsqueda por cada parámetro). Cuando ejecutas `Patient?name=lopez`, el servidor lo traduce a SQL con JOIN sobre sus tablas de índices. Entender SQL te permite diagnosticar por qué una búsqueda FHIR es lenta o por qué un parámetro no encuentra lo que esperas.

## Chuleta

| Cláusula / función | Para qué sirve | Ejemplo mínimo |
|--------------------|----------------|----------------|
| `SELECT col1, col2` | Elegir columnas | `SELECT nombre, apellido` |
| `FROM tabla` | Indicar la tabla | `FROM paciente` |
| `WHERE condicion` | Filtrar filas | `WHERE genero = 'F'` |
| `AND` / `OR` / `NOT` | Combinar condiciones | `WHERE a = 1 AND b = 2` |
| `LIKE 'pat%'` | Patrón de texto (`%` = varios, `_` = uno) | `WHERE apellido LIKE 'R%'` |
| `IN (...)` | Pertenencia a una lista | `WHERE municipio IN ('Apopa', 'Ilopango')` |
| `BETWEEN a AND b` | Rango inclusivo | `WHERE fecha BETWEEN '2026-01-01' AND '2026-06-30'` |
| `ORDER BY col ASC/DESC` | Ordenar el resultado | `ORDER BY fecha DESC` |
| `LIMIT n` | Recortar a n filas | `LIMIT 5` |
| `COUNT / SUM / AVG / MIN / MAX` | Agregar valores | `SELECT COUNT(*) FROM consulta` |
| `GROUP BY col` | Un resumen por grupo | `GROUP BY municipio` |
| `HAVING condicion` | Filtrar grupos | `HAVING COUNT(*) >= 2` |
| `INNER JOIN ... ON` | Unir tablas por clave | `JOIN consulta c ON c.paciente_id = p.id` |
| `LEFT JOIN ... ON` | Unir conservando la tabla izquierda | Incluye pacientes sin consultas |
| `IS NULL / IS NOT NULL` | Detectar ausencia de dato | `WHERE presion_sistolica IS NULL` |

## Autoevaluacion

1. ¿Por qué el sistema guarda pacientes y consultas en dos tablas separadas en lugar de una sola tabla con todo?
2. ¿Qué diferencia hay entre la clave primaria de `paciente` y la columna `paciente_id` de `consulta`?
3. ¿Qué devuelve `SELECT nombre FROM paciente WHERE nombre LIKE '_na';` y por qué no devuelve nombres como "Elena"?
4. Un reporte hecho con `INNER JOIN` entre paciente y consulta no muestra a un paciente registrado ayer. ¿Cuál es la causa más probable y con qué tipo de JOIN lo incluirías?
5. En una columna con los valores 120, 130, NULL y 150: ¿qué devuelve `COUNT(columna)` y qué devuelve `AVG(columna)`?
6. ¿Por qué `WHERE presion_sistolica = NULL` devuelve cero filas aunque existan consultas sin presión registrada?
7. Escribe la consulta que devuelve los 3 municipios con más pacientes, de mayor a menor.
8. ¿Cuál es el equivalente FHIR aproximado de una clave foránea y cuál el de la cláusula `WHERE`?

### Respuestas

1. Para no repetir los datos del paciente en cada consulta (normalización): se evita el desperdicio, la inconsistencia al actualizar y la pérdida de pacientes sin consultas.
2. `paciente.id` es la clave primaria (identifica de forma única a cada paciente); `consulta.paciente_id` es una clave foránea (apunta a esa clave primaria desde otra tabla).
3. Devuelve "Ana": `_` exige exactamente un carácter antes de "na". "Elena" tiene tres caracteres antes de "na", así que no coincide.
4. El paciente aún no tiene consultas y el `INNER JOIN` descarta las filas sin pareja. Con `LEFT JOIN` desde `paciente` aparecería con las columnas de consulta en NULL.
5. `COUNT(columna)` devuelve 3 (ignora el NULL); `AVG(columna)` devuelve 133.33 (promedio de 120, 130 y 150; también ignora el NULL).
6. Porque NULL es un desconocido: compararlo con `=` nunca da verdadero. Se usa `IS NULL`.
7. `SELECT municipio, COUNT(*) AS total FROM paciente GROUP BY municipio ORDER BY total DESC LIMIT 3;`
8. La clave foránea equivale a una referencia (`Patient/123` dentro de otro recurso); el `WHERE` equivale a los parámetros de búsqueda (`Patient?gender=female`).

## Para profundizar

- [W3Schools — SQL SELECT](https://www.w3schools.com/sql/sql_select.asp): tutorial interactivo con un botón "Try it Yourself" en cada ejemplo; ideal para practicar variaciones rápidas.
- [Documentación oficial de SQLite — SELECT](https://www.sqlite.org/lang_select.html): la referencia exacta del dialecto que usas en la práctica; consúltala cuando dudes de una sintaxis.
- [sqliteonline.com](https://sqliteonline.com): el entorno de práctica de este tema; SQLite completo en el navegador, sin instalar nada.
