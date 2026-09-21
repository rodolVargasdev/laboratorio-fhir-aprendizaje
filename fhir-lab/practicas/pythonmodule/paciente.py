paciente = {
    "id": "sv-100",
    "nombre": "Marta Rivas",
    "edad": 29,
    "sexo": "Female",
}

print(paciente["nombre"])
print(paciente.get("edad", "Desconocido"))
print(paciente.get("telefono", "No registrado"))  # devuelve valor por defecto si no existe