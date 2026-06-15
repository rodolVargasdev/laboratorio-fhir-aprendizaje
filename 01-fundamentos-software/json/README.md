# Dia 1: JSON y tu primer contacto con un servidor FHIR

Tiempo estimado: 2-3 horas (1h teoria, el resto practica).

## Por que empezamos por JSON

FHIR intercambia informacion clinica principalmente en formato JSON. Si lees
JSON con soltura, ya tienes ganada la mitad de la base que el examen da por
sabida. Hoy: entender JSON y leer un paciente real desde un servidor FHIR.

## Teoria simple con analogia

JSON (JavaScript Object Notation) es una forma de escribir datos como texto que
tanto humanos como programas entienden.

Analogia: piensa en una ficha de paciente como un formulario con casillas.
- Una casilla con su etiqueta y su valor es un par "clave": valor.
- Un conjunto de casillas agrupadas entre llaves { } es un objeto.
- Una lista de elementos entre corchetes [ ] es un array (por ejemplo, varios
  telefonos de contacto).

Ejemplo minimo de un paciente en JSON:

```json
{
  "resourceType": "Patient",
  "id": "ejemplo-1",
  "active": true,
  "name": [
    {
      "use": "official",
      "family": "Hernandez",
      "given": ["Maria", "Jose"]
    }
  ],
  "gender": "female",
  "birthDate": "1985-04-12"
}
```

Lo que debes notar:
- `resourceType` indica que tipo de recurso FHIR es. Aqui, un Patient.
- `name` es un array (corchetes) porque una persona puede tener varios nombres.
- Dentro de `name`, `given` es otro array (varios nombres de pila).
- Los tipos de valor: texto entre comillas, numeros sin comillas, true/false,
  objetos { } y arrays [ ].

### Rutas dentro del JSON (importante para FHIR)

Para referirte a un dato concreto se usa una "ruta". El apellido del ejemplo es:

    Patient.name[0].family   ->  "Hernandez"

Se lee: del Patient, el primer (indice 0) elemento de name, su campo family.
Esta notacion la veras constantemente en FHIR.

### JSON vs XML (lo veremos mas el Dia 2)

FHIR admite los dos formatos. JSON es el mas usado hoy. XML usa etiquetas
`<name>...</name>` en lugar de llaves. El examen espera que sepas LEER ambos.

## Practica

Tienes dos ejercicios en esta carpeta:

1. `ejercicio_1_local.py`
   Lee un paciente desde un archivo JSON local (`paciente_ejemplo.json`) y
   extrae campos usando rutas. No necesita internet. Empieza por aqui.

   ```powershell
   python 01-fundamentos-software\json\ejercicio_1_local.py
   ```

2. `ejercicio_2_servidor.py`
   Se conecta al servidor FHIR publico HAPI y descarga un Patient real,
   mostrando su JSON y extrayendo su nombre. Necesita internet.

   ```powershell
   python 01-fundamentos-software\json\ejercicio_2_servidor.py
   ```

### Reto del dia (hazlo tu)

Abre `ejercicio_1_local.py` y, donde dice "RETO", escribe el codigo para imprimir
la fecha de nacimiento y el genero del paciente. Pista: usa las mismas rutas que
ya estan de ejemplo.

## Autoevaluacion (responde mentalmente)

1. En el JSON de ejemplo, por que `name` esta entre corchetes [ ]?
2. Cual es la ruta para obtener el primer nombre de pila (given) del paciente?
3. Que campo te dice siempre de que tipo de recurso FHIR se trata?
4. Cual es la diferencia entre un objeto { } y un array [ ] en JSON?

Si dudaste en alguna, anotalo en `PROGRESO.md` para reforzarlo.

## Respuestas

1. Porque una persona puede tener varios nombres; el array permite una lista.
2. `Patient.name[0].given[0]`.
3. `resourceType`.
4. El objeto agrupa pares clave:valor; el array es una lista ordenada de elementos.
