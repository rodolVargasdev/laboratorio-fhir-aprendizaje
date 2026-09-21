cola = [
    {"nombre": "Marta Rivas", "edad": 52},
    {"nombre": "Hugo Serrano", "edad": 17},
    {"nombre": "Elsa Portillo", "edad": 71},
]
for p in cola:
    if p["edad"] >= 60:
        print(p.get("edad", "Desconocido"), "- prioridad alta")
    else:
        print(p["nombre"], "- prioridad normal") 