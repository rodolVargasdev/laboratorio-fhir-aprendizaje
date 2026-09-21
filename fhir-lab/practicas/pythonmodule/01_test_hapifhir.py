import requests                    # libreria HTTP (instalada con pip)

# URL del servidor publico + busqueda: dame 3 recursos Patient
url = "https://hapi.fhir.org/baseR4/Patient?_count=3"

respuesta = requests.get(url)      # hace la peticion GET y espera la respuesta

if respuesta.status_code != 200:   # 200 = OK; cualquier otra cosa es problema
    print("Error del servidor:", respuesta.status_code)
else:
    print(respuesta.json())
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
