pacientes = [
    {"nombre": "Carmen Flores", "edad": 47, "genero": "female"},
    {"nombre": "José Ramírez", "edad": 63, "genero": "male"},
    {"nombre": "Ana Castillo", "edad": 29, "genero": None},
]

for p in pacientes:
    genero = p.get("genero") or "sin dato"
    first_child_key = next(iter(p))
    first_child_value = next(iter(p.values()))
    first_child_keyvalue = next(iter(p.items()))
    print(first_child_key, ":" , first_child_value)
    print(first_child_keyvalue)
    print(type(p))
    print(type(first_child_key))
    print(type(first_child_value))
    print(type(first_child_keyvalue))
