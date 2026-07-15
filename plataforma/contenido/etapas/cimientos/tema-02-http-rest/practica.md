> **Como practicar este tema:** varios ejercicios puedes hacerlos en el navegador desde el [Laboratorio](/laboratorio). Los que piden tu PC usan los scripts en `legacy/dias/`; prepara tu entorno una sola vez con la [guia de setup](/setup).

# Dia 3: HTTP y REST (parte 1)

Objetivo: entender el modelo cliente-servidor, las URLs y los metodos HTTP, y
hacer lecturas (GET) de distintos tipos de recurso FHIR.
Tiempo: 2-3 horas. Costo: $0.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 3`.

## Teoria con analogia

REST es un estilo para que un cliente (tu app) pida cosas a un servidor por HTTP.
Analogia: un restaurante. La URL es la mesa/plato que pides; el metodo HTTP es la
accion (ver el menu, pedir, cambiar, cancelar).

Metodos HTTP principales (en FHIR):
- GET: leer (no cambia nada). Ej: ver un paciente.
- POST: crear algo nuevo (el servidor asigna el id).
- PUT: crear o reemplazar un recurso con id conocido.
- DELETE: borrar.

Anatomia de una URL FHIR:

    https://hapi.fhir.org/baseR4 / Patient / 123
    \______ base del servidor ___/ \_tipo_/ \id/

Cabeceras (headers) utiles:
- `Accept: application/fhir+json` -> "respondeme en JSON".
- `Content-Type: application/fhir+json` -> "lo que te envio es JSON" (en POST/PUT).

Interacciones de lectura en FHIR:
- read: GET [base]/Patient/123 (un recurso concreto).
- search: GET [base]/Patient?family=Perez (busqueda, devuelve un Bundle).
- vread (version): GET [base]/Patient/123/_history/1 (una version concreta).

## Practica

```powershell
python legacy\dias\dia-03\practica\explorar_rest.py
```

Hace GET de varios tipos (Patient, Observation, Organization) y muestra el
codigo de estado y cuantos resultados llegaron.
Reto: agrega un tipo mas (por ejemplo, "Practitioner") a la lista del script.

## Reto Feynman

En `PROGRESO.md`, explica con tus palabras la diferencia entre 'read' y 'search'
en FHIR, y por que search devuelve un Bundle.

---

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
python legacy\dias\dia-04\practica\buscar.py
```

Ejecuta varias busquedas y muestra el codigo de estado y el total.
Reto: agrega una busqueda de Patient por `gender=male` y compara el total.

## Reto Feynman

En `PROGRESO.md`, explica la diferencia entre un error 404 y un 422, con un
ejemplo de cada uno.

---

# Dia 5: Crear y modificar datos (CRUD) en un servidor de pruebas

Objetivo: crear (POST), leer, actualizar (PUT) y borrar (DELETE) recursos, y
entender la idempotencia.
Tiempo: 2-3 horas. Costo: $0 (servidor publico de pruebas; usa datos ficticios).

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion.
3. Practica.
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 5`.

## Teoria

CRUD = Create, Read, Update, Delete. En FHIR REST:

- Create: POST [base]/Patient con el recurso en el cuerpo. El servidor asigna el
  id y responde 201 Created con la cabecera Location del nuevo recurso.
- Read: GET [base]/Patient/{id}.
- Update: PUT [base]/Patient/{id} con el recurso completo. Si no existe y el
  servidor lo permite, lo crea (update-as-create).
- Delete: DELETE [base]/Patient/{id}.

### Idempotencia (concepto que cae en el examen)

Una operacion es idempotente si repetirla varias veces deja el sistema igual que
hacerla una vez.
- GET, PUT y DELETE son idempotentes.
- POST NO es idempotente: dos POST iguales crean dos recursos distintos.

Analogia: PUT es "deja el documento exactamente asi" (lo repitas o no, queda
igual). POST es "agrega una copia nueva" (cada vez agregas otra).

### Importante (seguridad y etica)

Estas en un servidor publico compartido. Usa SOLO datos ficticios. Nunca subas
datos reales de pacientes a servidores de prueba.

## Practica

```powershell
python legacy\dias\dia-05\practica\crud.py
```

El script crea un paciente ficticio, lo lee, lo actualiza y finalmente lo borra,
mostrando el codigo de estado en cada paso.
Reto: tras el DELETE, agrega un GET y observa que codigo de estado devuelve.

## Reto Feynman

En `PROGRESO.md`, explica por que PUT es idempotente y POST no, con un ejemplo.

---

# Dia 7: Repaso activo y consolidacion (Semana 1)

Objetivo: consolidar JSON, REST, CRUD y seguridad con recuperacion activa e
intercalado. Hoy NO hay tema nuevo: hoy demuestras lo aprendido.
Tiempo: 2-3 horas. Costo: $0.

## Rutina de hoy

1. Repaso espaciado completo:

   ```powershell
   python evaluacion\repaso.py
   python evaluacion\repaso.py --estado
   ```

   Mira cuantas tarjetas ya estan en cajas 3-5 (retencion creciente).

2. Quiz intercalado (mezcla preguntas de los dias 1-6):

   ```powershell
   python evaluacion\quiz_runner.py --repaso --n 15
   ```

3. Quiz de consolidacion de la semana:

   ```powershell
   python evaluacion\quiz_runner.py --dia 7
   ```

4. Repite la practica del dia que peor te haya salido (segun el desglose por
   Bloom y las preguntas falladas).

## Checklist objetivo de la Semana 1 (marca lo que ya dominas)

- [ ] Leo JSON anidado y uso rutas (Patient.name[0].family).
- [ ] Distingo objeto { } de array [ ].
- [ ] Hago GET (read) y search en FHIR.
- [ ] Interpreto codigos 2xx/4xx/5xx.
- [ ] Construyo busquedas con parametros y prefijos de fecha.
- [ ] Ejecuto un ciclo CRUD y explico la idempotencia.
- [ ] Explico authn vs authz, OAuth y SMART on FHIR, y scopes.

Criterio para avanzar a la Semana 2: quiz del dia 7 >= 80% y la mayoria del
checklist marcado. Si no, dedica este dia (o uno extra) a reforzar.

## Reto Feynman (integrador)

En `PROGRESO.md`, explica en un parrafo el viaje completo de un dato clinico:
desde que una app pide autorizacion (SMART/OAuth), hace un GET a un servidor FHIR,
recibe un Bundle en JSON, y tu lees un valor con una ruta. Usa tus palabras.