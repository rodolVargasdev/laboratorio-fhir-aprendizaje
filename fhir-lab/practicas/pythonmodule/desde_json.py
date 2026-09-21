import json
texto = '{"resourceType": "Patient", "name": [{"family": "Rivas", "given": ["Marta"]}]}'
recurso = json.loads(texto)
print(recurso["name"][0]["given"][0], recurso["name"][0]["family"])