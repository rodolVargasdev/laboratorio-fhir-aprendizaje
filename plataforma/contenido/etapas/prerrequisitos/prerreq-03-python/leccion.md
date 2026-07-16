# Python para interoperabilidad

> **En simple:** Python es el idioma con el que le darás órdenes a la computadora para hablar con servidores FHIR. Así como un traductor toma un documento en inglés y te lo entrega en español, un script de Python toma el JSON que devuelve un servidor y te entrega justo el dato que necesitas: el nombre de un paciente, su género, su fecha de nacimiento. Este tema te da lo suficiente para escribir y depurar esos scripts sin depender de nadie.

## Por qué Python domina en salud y datos

Cuando trabajes en la integración nacional de salud vas a encontrar Python en todas partes: scripts que migran pacientes de un sistema viejo a uno FHIR, validadores de recursos, reportes epidemiológicos, cuadernos de análisis. No es casualidad. Tres razones lo explican:

1. **Se lee casi como inglés.** Un ingeniero de otro equipo (o tú dentro de seis meses) puede abrir tu script y entenderlo sin manual. En instituciones públicas, donde el personal rota, eso vale oro.
2. **Sus estructuras de datos calzan con JSON.** FHIR viaja como JSON, y el diccionario de Python es prácticamente JSON con otra sintaxis. Convertir uno en otro es una sola línea de código.
3. **Su ecosistema de librerías es enorme.** `requests` para hablar HTTP, `json` para leer y escribir JSON, `fhir.resources` para validar recursos FHIR, `pandas` para analizar datos. Casi todo problema de interoperabilidad ya tiene una librería probada.

Otros lenguajes también sirven (JavaScript, Java, C#), pero Python es el que exige menos ceremonia para empezar: no compilas nada, escribes un archivo `.py` y lo ejecutas. Por eso es el estándar de facto para prototipos, scripts de integración y análisis de datos clínicos.

## Variables y tipos básicos

Una variable es una etiqueta que le pones a un valor para usarlo después. Se crea con `=` (una asignación, no una pregunta):

```python
nombre = "Carmen Flores"      # str: texto, siempre entre comillas
edad = 47                     # int: número entero
temperatura = 37.8            # float: número con decimales
activo = True                 # bool: True o False (con mayúscula inicial)
segundo_nombre = None         # None: ausencia deliberada de valor
```

Cada tipo tiene un rol claro en datos de salud:

| Tipo | Qué guarda | Ejemplo clínico |
|------|------------|-----------------|
| `str` | Texto | `"Carmen"`, `"female"`, `"O+"` |
| `int` | Enteros | Edad, número de consultas |
| `float` | Decimales | Temperatura, peso en kg |
| `bool` | Verdadero/falso | `activo = True` |
| `None` | Nada / sin dato | Segundo nombre no registrado |

Dos detalles que evitan errores frecuentes:

- `"47"` (con comillas) es texto; `47` (sin comillas) es número. `"47" + 1` explota con `TypeError` porque Python no mezcla tipos a ciegas. Para convertir: `int("47")` da `47`.
- `None` no es lo mismo que `0` ni que `""`. `None` significa "este dato no existe", algo constante en registros clínicos incompletos.

Para ver un valor usa `print()`:

```python
print("Paciente:", nombre, "| Edad:", edad)
# Paciente: Carmen Flores | Edad: 47
```

## Listas: colecciones ordenadas

Una lista guarda varios valores en orden, entre corchetes. Piensa en la cola de pacientes de una clínica: hay un orden, se puede contar, se puede recorrer.

```python
pacientes = ["Carmen Flores", "José Ramírez", "Ana Castillo"]

print(pacientes[0])       # Carmen Flores  (la posición empieza en 0)
print(pacientes[2])       # Ana Castillo
print(len(pacientes))     # 3  (cuántos elementos hay)

pacientes.append("Luis Mejía")   # agrega al final
print(len(pacientes))     # 4
```

El operador `in` pregunta si algo está dentro:

```python
print("Ana Castillo" in pacientes)   # True
print("Pedro Gómez" in pacientes)    # False
```

Detalle crítico: **los índices empiezan en 0**. El primer elemento es `[0]`, el segundo `[1]`. Pedir `pacientes[10]` cuando hay 4 elementos lanza `IndexError`. En FHIR esto importa muchísimo: el primer nombre de un paciente vive en `name[0]`, no en `name[1]`.

## Diccionarios: el JSON de Python

Aquí está el corazón del tema. Un diccionario guarda pares clave-valor entre llaves, y es la estructura con la que Python representa cualquier JSON, incluido un recurso FHIR. Piensa en él como una ficha clínica: cada campo (clave) tiene un dato (valor).

```python
paciente = {
    "resourceType": "Patient",
    "id": "sv-001",
    "active": True,
    "name": [
        {
            "family": "Flores",
            "given": ["Carmen", "Elena"]
        }
    ],
    "gender": "female",
    "birthDate": "1979-03-12"
}
```

Mira bien: esto ES un recurso Patient de FHIR escrito en Python. Las diferencias con JSON son mínimas (`True` en vez de `true`, `None` en vez de `null`). Todo lo que aprendas aquí aplica directo a FHIR.

### Acceso con corchetes

```python
print(paciente["gender"])       # female
print(paciente["birthDate"])    # 1979-03-12
```

Las estructuras se anidan: `name` es una lista de diccionarios, y `given` es una lista de strings. Para llegar al primer nombre encadenas accesos:

```python
print(paciente["name"][0]["family"])      # Flores
print(paciente["name"][0]["given"][0])    # Carmen
```

Lee la cadena de izquierda a derecha: del diccionario `paciente` toma `name` (una lista), de esa lista toma el elemento `0` (un diccionario), y de ese diccionario toma `family` (un string). Esa lectura por pasos es la habilidad número uno para navegar recursos FHIR.

### .get(): el acceso que no explota

Si pides una clave que no existe con corchetes, Python lanza `KeyError` y el script muere:

```python
print(paciente["telecom"])
# KeyError: 'telecom'
```

En datos clínicos reales los campos ausentes son la norma, no la excepción: hay pacientes sin teléfono, sin género registrado, sin fecha de nacimiento. Para eso existe `.get()`:

```python
print(paciente.get("telecom"))              # None (no explota)
print(paciente.get("telecom", "sin dato"))  # sin dato (valor por defecto)
print(paciente.get("gender", "sin dato"))   # female (la clave sí existe)
```

Regla práctica: usa corchetes cuando la clave DEBE existir (si falta, quieres enterarte con un error); usa `.get()` cuando el campo puede faltar legítimamente, que en FHIR es casi siempre.

### Utilidades que ya conoces de las listas

```python
print(len(paciente))              # 6 (número de claves)
print("gender" in paciente)       # True (¿existe la clave?)
print("telecom" in paciente)      # False

paciente["telecom"] = [{"system": "phone", "value": "7777-0000"}]  # agregar
paciente["active"] = False                                          # modificar
```

## Decisiones con if / elif / else

Un script útil toma decisiones: "si el paciente tiene género registrado, imprímelo; si no, imprime 'sin dato'". Eso se escribe con `if`:

```python
genero = paciente.get("gender")

if genero == "female":
    print("Paciente femenina")
elif genero == "male":
    print("Paciente masculino")
else:
    print("Género no registrado o distinto")
```

Reglas de sintaxis innegociables:

- La línea del `if`, `elif` y `else` termina en **dos puntos** (`:`). Olvidarlos produce `SyntaxError`.
- El bloque que se ejecuta va **indentado con 4 espacios**. En Python la indentación NO es estética: es sintaxis. Define qué líneas pertenecen al bloque. Una indentación mal puesta produce `IndentationError` o, peor, un programa que corre pero hace otra cosa.
- `==` compara (¿son iguales?); `=` asigna. Confundirlos es un clásico.

Los comparadores disponibles: `==`, `!=` (distinto), `<`, `>`, `<=`, `>=`, y los lógicos `and`, `or`, `not`.

## Repetir con for

El bucle `for` recorre una colección elemento por elemento. Es la herramienta con la que procesarás las listas de resultados que devuelven los servidores FHIR:

```python
pacientes = [
    {"nombre": "Carmen Flores", "edad": 47, "genero": "female"},
    {"nombre": "José Ramírez", "edad": 63, "genero": "male"},
    {"nombre": "Ana Castillo", "edad": 29, "genero": None},
]

for p in pacientes:
    genero = p.get("genero") or "sin dato"
    print(p["nombre"], "-", p["edad"], "años -", genero)
```

Salida:

```text
Carmen Flores - 47 años - female
José Ramírez - 63 años - male
Ana Castillo - 29 años - sin dato
```

En cada vuelta, la variable `p` toma el valor de un elemento de la lista. El cuerpo del bucle (todo lo indentado bajo el `for`) se ejecuta una vez por elemento. Combinar `for` + `if` + `.get()` es el patrón de trabajo diario en interoperabilidad: recorrer entradas, filtrar y extraer campos que pueden faltar.

## Funciones: empaquetar lógica con def

Cuando un bloque de código se repite, lo conviertes en función: un bloque con nombre, que recibe parámetros y devuelve un resultado con `return`.

```python
def nombre_completo(paciente):
    """Devuelve 'Nombres Apellido' de un recurso Patient, o 'sin nombre'."""
    nombres = paciente.get("name")
    if not nombres:                      # None o lista vacía
        return "sin nombre"
    primero = nombres[0]
    given = " ".join(primero.get("given", []))
    family = primero.get("family", "")
    return (given + " " + family).strip()

paciente = {"name": [{"family": "Flores", "given": ["Carmen", "Elena"]}]}
print(nombre_completo(paciente))   # Carmen Elena Flores
print(nombre_completo({}))         # sin nombre
```

Puntos clave:

- `def nombre(parametros):` define la función; el cuerpo va indentado.
- `return` entrega el resultado y termina la función. Sin `return`, la función devuelve `None`.
- Definir la función no la ejecuta; se ejecuta al **llamarla**: `nombre_completo(paciente)`.
- Una función bien nombrada documenta tu código: `nombre_completo(p)` se explica sola.

## El módulo json: del texto al diccionario y de vuelta

Cuando un servidor FHIR responde, lo que llega por la red es **texto** con formato JSON, no un diccionario. El módulo `json` (incluido en Python, no se instala) convierte en ambas direcciones:

```python
import json

# Texto JSON -> diccionario (lo que haces al RECIBIR datos)
texto = '{"resourceType": "Patient", "id": "sv-001", "gender": "female"}'
recurso = json.loads(texto)          # loads = load string
print(recurso["gender"])             # female

# Diccionario -> texto JSON (lo que haces al ENVIAR o guardar datos)
salida = json.dumps(recurso, indent=2)   # indent=2: legible para humanos
print(salida)
```

Para archivos, las variantes sin `s` trabajan directo con el archivo abierto:

```python
with open("paciente.json", "r", encoding="utf-8") as f:
    recurso = json.load(f)           # lee el archivo y lo convierte

with open("copia.json", "w", encoding="utf-8") as f:
    json.dump(recurso, f, indent=2)  # escribe el diccionario como JSON
```

Mnemotecnia: la `s` final es de *string*. `loads`/`dumps` trabajan con texto en memoria; `load`/`dump` con archivos.

## Entorno virtual y pip: tu caja de herramientas aislada

`requests`, la librería para hacer peticiones HTTP, no viene con Python: se instala con `pip`. Pero antes conviene crear un **entorno virtual**: una carpeta con una copia aislada de Python y sus librerías, exclusiva de tu proyecto. Es como que cada proyecto tenga su propio botiquín en vez de compartir uno solo: lo que instalas para un proyecto no contamina a los demás.

```powershell
# PowerShell (Windows)
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install requests
```

```bash
# bash (Linux / macOS)
python3 -m venv .venv
source .venv/bin/activate
pip install requests
```

Al activarse, el prompt de la terminal muestra `(.venv)` al inicio. Desde ese momento, `pip install` guarda librerías dentro de `.venv` y `python` usa esa copia. Si cierras la terminal, el entorno se desactiva: tendrás que activarlo de nuevo antes de correr tus scripts. Si PowerShell se niega a activar por políticas de ejecución, corre una vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## El script completo: pacientes reales desde un servidor FHIR

Todo lo anterior converge aquí. Este script consulta el servidor público HAPI FHIR y extrae el nombre de tres pacientes. Guárdalo como `pacientes.py` y léelo línea por línea:

```python
import requests                    # libreria HTTP (instalada con pip)

# URL del servidor publico + busqueda: dame 3 recursos Patient
url = "https://hapi.fhir.org/baseR4/Patient?_count=3"

respuesta = requests.get(url)      # hace la peticion GET y espera la respuesta

if respuesta.status_code != 200:   # 200 = OK; cualquier otra cosa es problema
    print("Error del servidor:", respuesta.status_code)
else:
    bundle = respuesta.json()      # convierte el texto JSON en diccionario

    # Un Bundle agrupa resultados; cada resultado vive en la lista "entry"
    entradas = bundle.get("entry", [])   # [] por si no hubo resultados
    print("Pacientes recibidos:", len(entradas))

    for entrada in entradas:                       # una vuelta por paciente
        paciente = entrada["resource"]             # el Patient esta en "resource"
        nombres = paciente.get("name", [])         # "name" puede faltar

        if nombres:                                # hay al menos un nombre
            given = " ".join(nombres[0].get("given", []))
            family = nombres[0].get("family", "")
            print("-", (given + " " + family).strip())
        else:
            print("- (paciente sin nombre registrado)")
```

Ejecución y salida típica (los nombres varían, es un servidor de pruebas):

```text
(.venv) PS> python pacientes.py
Pacientes recibidos: 3
- John Smith
- Ana Torres
- (paciente sin nombre registrado)
```

Fíjate en el patrón defensivo: se verifica `status_code`, se usa `.get()` con valores por defecto en cada campo opcional, y se maneja el caso de paciente sin nombre. Ese estilo es el que distingue un script que sobrevive a datos reales de uno que muere al tercer paciente.

## Errores comunes

Los errores de Python se llaman *tracebacks* y se leen **de abajo hacia arriba**: la última línea dice QUÉ pasó; las de arriba dicen DÓNDE. Estos son los cuatro que verás primero:

**IndentationError** — un bloque mal indentado:

```text
  File "script.py", line 3
    print(nombre)
    ^
IndentationError: expected an indented block after 'if' statement on line 2
```

Causa: después de un `if`, `for` o `def`, la línea siguiente debe ir indentada con 4 espacios y no lo está. Corrige la indentación de la línea que señala la flecha.

**KeyError** — pediste una clave que no existe:

```text
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    print(paciente["telecom"])
KeyError: 'telecom'
```

Causa: acceso con corchetes a una clave ausente. Solución: `paciente.get("telecom", "sin dato")`, o verifica antes con `"telecom" in paciente`.

**ModuleNotFoundError** — la librería no está instalada en el entorno activo:

```text
Traceback (most recent call last):
  File "script.py", line 1, in <module>
    import requests
ModuleNotFoundError: No module named 'requests'
```

Causa: falta `pip install requests`, o lo instalaste en OTRO entorno (revisa que el prompt muestre `(.venv)` antes de instalar y ejecutar).

**SyntaxError** — casi siempre, dos puntos olvidados:

```text
  File "script.py", line 2
    if edad > 18
                ^
SyntaxError: expected ':'
```

Causa: `if`, `elif`, `else`, `for` y `def` terminan en `:`. Python te señala la posición exacta con `^`.

Rutina de depuración: (1) lee la última línea del traceback, (2) identifica el tipo de error, (3) ve al archivo y línea que indica, (4) corrige y vuelve a ejecutar. Nunca ignores el número de línea: es la pista principal.

## Nivel siguiente

Con esta base puedes crecer en cuatro direcciones, todas útiles para la certificación y para dirigir integraciones:

- **fhir.resources**: librería Python que valida recursos FHIR con tipos reales (`Patient.parse_obj(dato)` rechaza recursos malformados). Es el paso de "leer JSON a mano" a "trabajar con objetos FHIR validados".
- **try/except**: manejo de excepciones para que un error de red o un campo inesperado no mate el script completo, sino que se registre y se continúe con el siguiente paciente.
- **pandas**: convierte listas de pacientes en tablas analizables (filtrar, agrupar, exportar a Excel). Clave para reportes institucionales.
- **Jupyter Notebooks**: cuadernos interactivos donde mezclas código, resultados y notas; ideales para explorar un servidor FHIR nuevo antes de escribir el script definitivo.

## Chuleta

| Quiero... | Código |
|-----------|--------|
| Guardar un valor | `edad = 47` |
| Mostrar en pantalla | `print("Edad:", edad)` |
| Lista y su tamaño | `lista = [1, 2, 3]` / `len(lista)` |
| Primer elemento | `lista[0]` |
| Diccionario | `p = {"gender": "female"}` |
| Acceso obligatorio | `p["gender"]` (falla si no existe) |
| Acceso seguro | `p.get("gender", "sin dato")` |
| ¿Existe la clave? | `"gender" in p` |
| Decidir | `if x == 1:` / `elif` / `else:` (con `:` e indentación) |
| Recorrer | `for item in lista:` |
| Función | `def f(a):` ... `return resultado` |
| Texto JSON a dict | `json.loads(texto)` |
| Dict a texto JSON | `json.dumps(d, indent=2)` |
| Archivo JSON a dict | `json.load(archivo)` |
| Petición GET | `r = requests.get(url)` |
| ¿Respondió bien? | `r.status_code == 200` |
| Respuesta como dict | `r.json()` |
| Crear entorno | `python -m venv .venv` |
| Activar (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Activar (bash) | `source .venv/bin/activate` |
| Instalar librería | `pip install requests` |

## Autoevaluacion

1. ¿Cuál es la diferencia entre `paciente["gender"]` y `paciente.get("gender")` cuando la clave `gender` no existe?
2. En el diccionario `p = {"name": [{"given": ["Ana", "María"]}]}`, ¿qué expresión devuelve `"María"`?
3. ¿Qué imprime este código? `for n in [1, 2, 3]:` seguido de `    print(n * 2)`
4. Un script termina con `ModuleNotFoundError: No module named 'requests'` aunque ya corriste `pip install requests` ayer. ¿Cuál es la causa más probable?
5. ¿Por qué la indentación en Python no es una cuestión de estilo?
6. ¿Qué diferencia hay entre `json.loads()` y `json.load()`?
7. En el script de la lección, ¿por qué se usa `bundle.get("entry", [])` en lugar de `bundle["entry"]`?
8. ¿Qué valor tiene `respuesta.status_code` cuando la petición fue exitosa, y qué hace `.json()` sobre la respuesta?

### Respuestas

1. Con corchetes lanza `KeyError` y el script muere; con `.get()` devuelve `None` (o el valor por defecto que pases como segundo argumento) y el script continúa.
2. `p["name"][0]["given"][1]` — del dict toma `name` (lista), su elemento 0 (dict), su clave `given` (lista) y el elemento 1.
3. Imprime `2`, `4` y `6`, cada uno en su línea: el cuerpo se ejecuta una vez por elemento.
4. Instalaste `requests` en otro entorno (o sin el venv activo). Activa `.venv` (el prompt debe mostrar `(.venv)`) y reinstala ahí.
5. Porque la indentación ES la sintaxis que define qué líneas pertenecen a un bloque (`if`, `for`, `def`). Cambiarla cambia la lógica del programa o produce `IndentationError`.
6. `loads` convierte un string JSON que ya tienes en memoria; `load` lee y convierte directamente desde un archivo abierto. La `s` es de *string*.
7. Porque si la búsqueda no devuelve resultados, el Bundle puede venir sin la clave `entry`; con `.get("entry", [])` el `for` recorre una lista vacía en vez de morir con `KeyError`.
8. `200` indica éxito. `.json()` convierte el cuerpo de la respuesta (texto JSON) en estructuras de Python (diccionarios y listas), equivalente a `json.loads(respuesta.text)`.

## Para profundizar

- [Tutorial oficial de Python en español](https://docs.python.org/es/3/tutorial/) — la referencia canónica; los capítulos 3 a 5 cubren tipos, listas y diccionarios con más detalle que esta lección.
- [Módulo json (documentación oficial en español)](https://docs.python.org/es/3/library/json.html) — todos los parámetros de `loads`, `dumps`, `load` y `dump`, incluidas opciones de codificación.
- [Documentación oficial de requests](https://requests.readthedocs.io/en/latest/) — guía de inicio rápido con GET, POST, cabeceras y manejo de respuestas; la usarás en todos los temas de FHIR.
- [Servidor HAPI FHIR público](https://hapi.fhir.org/baseR4) — el servidor de pruebas contra el que corren los scripts de este tema; puedes abrir la URL en el navegador y ver el JSON crudo.
