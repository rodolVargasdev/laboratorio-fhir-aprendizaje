# Practica

## Objetivo

Ejecutar consultas SQL reales contra un mini sistema de salud (10 pacientes, 14 consultas) hasta poder escribir sin ayuda: filtros con `WHERE`, patrones con `LIKE`, orden con `ORDER BY`, conteos con `GROUP BY`, un `INNER JOIN` y la detección de nulos con `IS NULL`. Cada paso indica el resultado exacto que debes ver; si no coincide, algo hay que corregir antes de seguir.

## Ejercicios guiados

### 1. Preparar la base de datos

Abre [https://sqliteonline.com](https://sqliteonline.com), borra lo que haya en el editor, pega el bloque completo de abajo y pulsa **Run**.

```sql
CREATE TABLE paciente (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento TEXT NOT NULL,
  genero TEXT NOT NULL,
  municipio TEXT NOT NULL
);

CREATE TABLE consulta (
  id INTEGER PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES paciente(id),
  fecha TEXT NOT NULL,
  motivo TEXT NOT NULL,
  presion_sistolica INTEGER
);

INSERT INTO paciente (id, nombre, apellido, fecha_nacimiento, genero, municipio) VALUES
(1, 'Carlos', 'Ramirez', '1985-03-12', 'M', 'San Salvador'),
(2, 'Maria', 'Lopez', '1990-07-25', 'F', 'Santa Ana'),
(3, 'Jose', 'Hernandez', '1978-11-02', 'M', 'Soyapango'),
(4, 'Ana', 'Martinez', '2001-01-19', 'F', 'San Salvador'),
(5, 'Luis', 'Flores', '1969-05-30', 'M', 'San Miguel'),
(6, 'Carmen', 'Rivas', '1995-09-14', 'F', 'Santa Tecla'),
(7, 'Pedro', 'Vasquez', '1982-04-08', 'M', 'Soyapango'),
(8, 'Sofia', 'Cruz', '2010-12-03', 'F', 'San Salvador'),
(9, 'Miguel', 'Ayala', '1957-06-21', 'M', 'Santa Ana'),
(10, 'Elena', 'Portillo', '1988-02-17', 'F', 'Mejicanos');

INSERT INTO consulta (id, paciente_id, fecha, motivo, presion_sistolica) VALUES
(1, 1, '2026-01-10', 'Control de hipertension', 145),
(2, 1, '2026-03-15', 'Control de hipertension', 138),
(3, 2, '2026-01-22', 'Dolor de cabeza', 120),
(4, 3, '2026-02-05', 'Control de diabetes', 130),
(5, 3, '2026-04-18', 'Control de diabetes', NULL),
(6, 4, '2026-02-14', 'Gripe', NULL),
(7, 5, '2026-01-30', 'Dolor lumbar', 150),
(8, 5, '2026-03-02', 'Control de hipertension', 142),
(9, 5, '2026-05-11', 'Control de hipertension', 136),
(10, 6, '2026-02-20', 'Chequeo general', 110),
(11, 7, '2026-03-08', 'Tos persistente', 125),
(12, 8, '2026-04-01', 'Vacunacion', NULL),
(13, 9, '2026-01-15', 'Control de hipertension', 160),
(14, 9, '2026-04-25', 'Mareos', 155);
```

**Resultado esperado:** en el panel izquierdo aparecen las tablas `paciente` y `consulta`. Verifica con `SELECT COUNT(*) FROM paciente;` (debe dar **10**) y `SELECT COUNT(*) FROM consulta;` (debe dar **14**).

### 2. Ver todo

```sql
SELECT * FROM paciente;
```

**Resultado esperado:** 10 filas y 6 columnas. Localiza a Elena Portillo (id 10): la usaremos después.

### 3. Filtrar con WHERE

```sql
SELECT nombre, apellido
FROM paciente
WHERE municipio = 'San Salvador';
```

**Resultado esperado:** exactamente 3 filas: Carlos Ramirez, Ana Martinez y Sofia Cruz.

### 4. Buscar por patrón con LIKE

```sql
SELECT nombre, apellido
FROM paciente
WHERE apellido LIKE 'R%';
```

**Resultado esperado:** 2 filas: Ramirez y Rivas. Prueba luego `WHERE nombre LIKE '_na'` y comprueba que devuelve solo a Ana (el `_` exige exactamente un carácter antes de "na").

### 5. Ordenar y limitar

```sql
SELECT nombre, apellido, fecha_nacimiento
FROM paciente
ORDER BY fecha_nacimiento ASC
LIMIT 3;
```

**Resultado esperado:** 3 filas en este orden: Miguel Ayala (1957-06-21), Luis Flores (1969-05-30), Jose Hernandez (1978-11-02). Cambia a `DESC` y la primera fila pasa a ser Sofia Cruz (2010-12-03).

### 6. Contar por municipio

```sql
SELECT municipio, COUNT(*) AS total
FROM paciente
GROUP BY municipio
ORDER BY total DESC, municipio ASC;
```

**Resultado esperado:** 6 filas: San Salvador 3, Santa Ana 2, Soyapango 2, Mejicanos 1, San Miguel 1, Santa Tecla 1.

### 7. Unir tablas con INNER JOIN

```sql
SELECT p.nombre, p.apellido, c.fecha, c.motivo
FROM paciente AS p
INNER JOIN consulta AS c ON c.paciente_id = p.id
ORDER BY c.fecha;
```

**Resultado esperado:** 14 filas (una por consulta). Revisa la lista: Elena Portillo **no aparece** porque no tiene consultas; el `INNER JOIN` la descarta en silencio.

### 8. Encontrar los datos faltantes con IS NULL

```sql
SELECT c.id, p.nombre, c.fecha, c.motivo
FROM consulta AS c
INNER JOIN paciente AS p ON p.id = c.paciente_id
WHERE c.presion_sistolica IS NULL;
```

**Resultado esperado:** exactamente 3 filas: las consultas 5 (Jose), 6 (Ana) y 12 (Sofia). Comprueba después que `WHERE c.presion_sistolica = NULL` devuelve 0 filas: esa es la trampa clásica de NULL.

## En la PC

Si tienes `sqlite3` instalado (ver [Setup](/setup)), puedes hacer lo mismo en la terminal: ejecuta `sqlite3 salud.db`, pega el bloque del paso 1 y lanza las mismas consultas. El comando `.tables` lista las tablas y `.quit` sale. No es obligatorio: sqliteonline.com cubre toda la práctica.

## Retos

1. **Nacidos antes de 1980**: escribe la consulta que devuelve nombre y fecha de nacimiento de los pacientes nacidos antes del 1980-01-01. Éxito: exactamente **3 filas**.
2. **Presiones altas**: consultas con `presion_sistolica` mayor o igual a 140, mostrando fecha, motivo y presión. Éxito: exactamente **5 filas** (valores 145, 150, 142, 160 y 155).
3. **Municipios concurridos**: usando `GROUP BY` y `HAVING`, municipios con 2 o más pacientes. Éxito: exactamente **3 filas** (San Salvador, Santa Ana, Soyapango).
4. **Pacientes frecuentes**: con `JOIN`, `GROUP BY` y `HAVING`, nombre y número de consultas de los pacientes con 2 o más consultas. Éxito: exactamente **4 filas** (Carlos 2, Jose 2, Luis 3, Miguel 2).
5. **El paciente invisible**: usando `LEFT JOIN` desde `paciente` y `WHERE c.id IS NULL`, encuentra al paciente sin consultas. Éxito: exactamente **1 fila**: Elena Portillo.
6. **Promedio por paciente**: promedio de presión sistólica por paciente, ordenado de mayor a menor. Éxito: la primera fila es Miguel Ayala con **157.5**.

## Reto Feynman

Explica por escrito, en 4-6 líneas y sin tecnicismos, a un colega del área administrativa: (1) por qué el sistema guarda pacientes y consultas en dos tablas separadas en lugar de una sola hoja gigante, y (2) qué es la clave foránea `paciente_id` usando la analogía del número de expediente. Si tu explicación necesita las palabras "normalización" o "integridad referencial", todavía no está lista.

## Criterio de completado

- [ ] Pegué el bloque inicial y los conteos dieron 10 pacientes y 14 consultas.
- [ ] Ejecuté los 8 ejercicios guiados y cada resultado coincidió con el esperado.
- [ ] Resolví al menos 4 de los 6 retos con el número exacto de filas indicado.
- [ ] Encontré al paciente sin consultas usando `LEFT JOIN` e `IS NULL`.
- [ ] Escribí el Reto Feynman sin usar jerga técnica.
- [ ] Puedo escribir de memoria un `SELECT` con `WHERE`, `ORDER BY` y `LIMIT` sin mirar la lección.
