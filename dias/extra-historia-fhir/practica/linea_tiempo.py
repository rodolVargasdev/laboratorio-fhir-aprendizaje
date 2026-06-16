r"""Extra Historia FHIR - Practica: ordenar hitos en la linea de tiempo.

Refuerza la narrativa cronologica del nacimiento de FHIR.
Ejecuta:
    python dias\extra-historia-fhir\practica\linea_tiempo.py
"""

import random

HITOS = [
    ("1989", "HL7 publica Version 2 (mensajes pipe-delimited, adopcion masiva)"),
    ("2000s", "HL7 v3 y RIM: modelo riguroso, implementacion compleja"),
    ("2011", "Inicia trabajo en Resources / lo que se convertira en FHIR (Grahame Grieve)"),
    ("2014", "Primera ola DSTU1; arranca Proyecto Argonaut con grandes EHR vendors"),
    ("2015", "DSTU2: pilotos y primeros Implementation Guides"),
    ("2017", "STU3: adopcion industrial amplia"),
    ("2019", "FHIR R4: version normativa clave (base del examen Foundational)"),
    ("2023", "FHIR R5 publicado; ecosistema en transicion gradual desde R4"),
]


def main() -> None:
    print("=" * 70)
    print("LINEA DE TIEMPO FHIR — ordena los hitos de mas antiguo a mas reciente")
    print("=" * 70)
    print("\nVeras 8 eventos mezclados. Escribe los numeros en orden, separados por coma.")
    print("Ejemplo: 3,1,2,4,5,6,7,8\n")

    mezclados = list(enumerate(HITOS, 1))
    random.shuffle(mezclados)

    for num, (anio, desc) in mezclados:
        print(f"  [{num}] {anio} — {desc}")

    print()
    crudo = input("Tu orden (numeros separados por coma): ").strip()
    try:
        elegidos = [int(x.strip()) for x in crudo.split(",") if x.strip()]
    except ValueError:
        print("Entrada invalida. Usa solo numeros separados por coma.")
        return

    if len(elegidos) != len(HITOS):
        print(f"Esperaba {len(HITOS)} numeros, recibi {len(elegidos)}.")
        return

    # Mapa numero -> indice en HITOS original (1-based en mezclados)
    num_a_hito = {num: hito for num, hito in mezclados}
    secuencia = [num_a_hito[n] for n in elegidos]
    correcta = secuencia == HITOS

    print("\n--- Tu secuencia ---")
    for anio, desc in secuencia:
        print(f"  {anio} — {desc}")

    if correcta:
        print("\nCorrecto. Tienes clara la cronologia base.")
    else:
        print("\nAun no coincide. Secuencia esperada:")
        for anio, desc in HITOS:
            print(f"  {anio} — {desc}")
        print("\nRepasa la seccion 2-4 del README del modulo extra.")

    print("\nReflexion (escribe en notas/extra-historia-fhir.md):")
    print("  Que hito te sorprendio mas y por que?")


if __name__ == "__main__":
    main()
