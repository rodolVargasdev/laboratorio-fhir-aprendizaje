# JSON en 10 minutos

> **En simple:** JSON es una forma de escribir datos como texto, con etiquetas y
> valores, para que una computadora los entienda. Piensa en una ficha con casillas.

## Las dos piezas

- **Objeto** `{ }`: agrupa pares `"clave": valor`. Como una ficha con casillas etiquetadas.
- **Lista (array)** `[ ]`: una secuencia ordenada de elementos.

```json
{
  "nombre": "Maria",
  "edad": 34,
  "activa": true,
  "telefonos": ["7777-0000", "2222-1111"]
}
```

- `"nombre"` es una clave; `"Maria"` su valor (texto, va entre comillas).
- `edad` es un numero (sin comillas). `activa` es booleano (`true`/`false`).
- `telefonos` es una **lista** con dos textos.

## Rutas: como se nombra un dato

Para el primer telefono decimos `telefonos[0]` (las listas empiezan en 0).
FHIR usa mucho esta idea: `Patient.name[0].family` = "del paciente, el primer
nombre, su apellido".

## Lo minimo que debes recordar

- Objeto = casillas con etiqueta; lista = fila ordenada que empieza en 0.
- El texto va entre comillas dobles; numeros y `true/false` no.
