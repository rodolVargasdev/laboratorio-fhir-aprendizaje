# Dia 4: REST (parte 2) - codigos de estado y busqueda

Objetivo: interpretar codigos de estado HTTP y construir busquedas (search) FHIR
con parametros.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 4`.

## Teoria

### Codigos de estado HTTP (los que mas veras)

- 2xx exito: 200 OK (lectura), 201 Created (creacion).
- 4xx error del CLIENTE: 400 peticion mal formada, 401 no autenticado,
  403 no autorizado, 404 no encontrado, 422 recurso no valido.
- 5xx error del SERVIDOR: 500 error interno, 503 no disponible.

Regla mental: 4xx = "lo hiciste mal tu", 5xx = "fallo el servidor".

### Busqueda (search) en FHIR

Se hace con GET sobre el tipo de recurso y parametros en la query string:

    GET [base]/Patient?family=Perez&gender=female
    GET [base]/Observation?code=8867-4
    GET [base]/Observation?date=ge2024-01-01     (ge = mayor o igual)

Parametros utiles de control:
- `_count=10` cuantos resultados por pagina.
- `_sort=birthdate` ordenar.
- `_include` traer recursos referenciados.

Prefijos de comparacion para fechas/numeros: eq, ne, gt, lt, ge, le.

El resultado es un Bundle de tipo 'searchset'. Su campo `total` indica cuantos
hay; `entry` trae los recursos de la pagina actual; `link` con relation "next"
permite paginar.

## Practica

```powershell
python dias\dia-04\practica\buscar.py
```

Ejecuta varias busquedas y muestra el codigo de estado y el total.
Reto: agrega una busqueda de Patient por `gender=male` y compara el total.

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre un error 404 y un 422, con un
ejemplo de cada uno.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 4 de FHIR. Tema: codigos de estado HTTP y busqueda
FHIR. Soy desarrollador intermedio, en espanol, mentalidad Google Cloud. No me
des respuestas directas: preguntame primero (recuperacion activa) y corrige con
pistas. Objetivos: (1) interpretar 2xx/4xx/5xx, (2) construir search con varios
parametros, (3) usar prefijos de fecha (ge, le, gt, lt) y parametros _count,
_sort, (4) entender el Bundle searchset y la paginacion. Errores a vigilar:
confundir 4xx con 5xx, olvidar que search devuelve Bundle, mal uso de prefijos
de fecha. Al final pideme que explique 404 vs 422 (Feynman).
