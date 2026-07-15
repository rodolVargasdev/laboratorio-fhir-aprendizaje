# SQL minimo

> **En simple:** una base de datos SQL es una hoja de calculo gigante. SQL es como
> le pides datos: "traeme estas columnas de esta tabla, donde se cumpla X".

## Ideas base

- **Tabla**: una hoja (por ejemplo `pacientes`).
- **Fila**: un registro (un paciente).
- **Columna**: un campo (`nombre`, `edad`).

## La consulta mas comun

```sql
SELECT nombre, edad
FROM pacientes
WHERE edad > 18;
```

- `SELECT` = que columnas quiero.
- `FROM` = de que tabla.
- `WHERE` = con que condicion.

En esta plataforma casi todo lo resuelve el sistema; SQL te sirve para entender
como se guardan tu progreso y los datos.
