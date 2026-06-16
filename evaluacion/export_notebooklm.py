r"""Exporta el material de un dia a un unico Markdown para NotebookLM.

Genera un archivo autocontenido con leccion, practica, quiz (con respuestas para
repaso), flashcards y prompts sugeridos para el chat de NotebookLM.

Uso:
    python evaluacion\export_notebooklm.py --dia 17
    python evaluacion\export_notebooklm.py --dia 1 --notas mis-notas-dia1.md
    python evaluacion\export_notebooklm.py --desde 1 --hasta 7   # semana 1
    python evaluacion\export_notebooklm.py --extra historia-fhir

Salida (local, no se sube a git):
    evaluacion/exports/dia-17-notebooklm.md
    evaluacion/exports/extra-historia-fhir-notebooklm.md
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DIR_DIAS = RAIZ / "dias"
DIR_EXPORTS = Path(__file__).resolve().parent / "exports"
FLASHCARDS = Path(__file__).resolve().parent / "flashcards.json"
BLUEPRINTS = Path(__file__).resolve().parent / "blueprints.json"

EXTENSIONES_PRACTICA = {".py", ".md", ".json"}
OMITIR_JSON = {"quiz.json"}


def carpeta_dia(num: int) -> Path:
    return DIR_DIAS / f"dia-{num:02d}"


def carpeta_extra(slug: str) -> Path:
    if slug.startswith("extra-"):
        return DIR_DIAS / slug
    return DIR_DIAS / f"extra-{slug}"


def cargar_json(ruta: Path) -> dict | list:
    return json.loads(ruta.read_text(encoding="utf-8"))


def dominios_certificacion(num: int) -> list[str]:
    if not BLUEPRINTS.exists():
        return []
    datos = cargar_json(BLUEPRINTS)
    lineas: list[str] = []
    for cert, info in datos.get("certificaciones", {}).items():
        for dom in info.get("dominios", []):
            if num in dom.get("dias", []):
                lineas.append(f"- **{cert}** — {dom.get('nombre', dom.get('clave', ''))}")
    return lineas


def leccion_sin_prompt_composer(texto: str) -> str:
    """Quita el bloque de Composer (solo util en Cursor, no en NotebookLM)."""
    patron = r"\n## Prompt para Composer.*\Z"
    return re.sub(patron, "", texto, flags=re.DOTALL).strip() + "\n"


def formatear_quiz(quiz: dict) -> str:
    partes = [
        f"**Tema:** {quiz.get('tema', '')}",
        f"**Umbral de maestria:** {int(quiz.get('umbral_maestria', 0.8) * 100)}%",
        "",
        "Usa estas preguntas para repaso activo. Cubre las respuestas antes de leerlas.",
        "",
    ]
    for i, p in enumerate(quiz.get("preguntas", []), 1):
        bloom = p.get("bloom", "?")
        partes.append(f"### Pregunta {i} [{bloom}]")
        partes.append(p["pregunta"])
        partes.append("")

        tipo = p.get("tipo", "")
        if tipo == "opcion_multiple":
            for j, op in enumerate(p.get("opciones", [])):
                marca = " **<- respuesta**" if j == p.get("respuesta") else ""
                partes.append(f"- {chr(97 + j)}) {op}{marca}")
        elif tipo == "verdadero_falso":
            partes.append(f"- **Respuesta:** {'Verdadero' if p.get('respuesta') else 'Falso'}")
        elif tipo == "respuesta_corta":
            validas = ", ".join(p.get("respuestas_validas", []))
            partes.append(f"- **Respuestas validas:** {validas}")

        if p.get("explicacion"):
            partes.append(f"- **Por que:** {p['explicacion']}")
        partes.append("")
    return "\n".join(partes)


def formatear_flashcards(num: int | None = None, modulo: str | None = None) -> str:
    if not FLASHCARDS.exists():
        return "_No hay flashcards configuradas._\n"
    tarjetas = cargar_json(FLASHCARDS)
    if modulo:
        tarjetas = [t for t in tarjetas if t.get("modulo") == modulo]
    elif num is not None:
        tarjetas = [t for t in tarjetas if t.get("dia") == num]
    if not tarjetas:
        return "_No hay flashcards para este modulo._\n"
    lineas = ["Formato Leitner: cubre el reverso antes de leerlo.", ""]
    for t in tarjetas:
        lineas.append(f"### {t.get('id', '')} ({t.get('tema', '')})")
        lineas.append(f"**Frente:** {t.get('frente', '')}")
        lineas.append(f"**Reverso:** {t.get('reverso', '')}")
        lineas.append("")
    return "\n".join(lineas)


def archivos_practica(carpeta: Path) -> list[Path]:
    practica = carpeta / "practica"
    if not practica.is_dir():
        return []
    archivos: list[Path] = []
    for f in sorted(practica.rglob("*")):
        if not f.is_file():
            continue
        if f.suffix.lower() not in EXTENSIONES_PRACTICA:
            continue
        if f.name in OMITIR_JSON:
            continue
        if f.stat().st_size > 80_000:
            continue
        archivos.append(f)
    return archivos


def bloque_practica(archivos: list[Path], carpeta: Path) -> str:
    if not archivos:
        return "_Este dia no tiene archivos de practica en la carpeta practica/._\n"
    partes: list[str] = []
    for f in archivos:
        rel = f.relative_to(carpeta)
        contenido = f.read_text(encoding="utf-8", errors="replace")
        lang = "python" if f.suffix == ".py" else "json" if f.suffix == ".json" else ""
        partes.append(f"### Archivo: `{rel}`")
        partes.append(f"```{lang}")
        partes.append(contenido.rstrip())
        partes.append("```")
        partes.append("")
    return "\n".join(partes)


def prompts_notebooklm_etiqueta(etiqueta: str, tema: str) -> str:
    return f"""Usa estos prompts en el chat de NotebookLM (con este documento como fuente):

1. **Resumen ejecutivo:** "Resume los 5 conceptos clave de {etiqueta} ({tema}) en bullets cortos para alguien que implementa FHIR en DoctorSV."

2. **Examen oral:** "Hazme 10 preguntas de dificultad creciente sobre {etiqueta}. Espera mi respuesta antes de corregir. Se exigente como un examen HL7."

3. **Feynman:** "Voy a explicarte {tema} con mis palabras. Detecta errores, vacios y ambiguedades."

4. **Tarjetas de memoria:** "Genera 15 tarjetas pregunta-respuesta basadas solo en este material. Formato: pregunta en una linea, respuesta en la siguiente."

5. **Audio Overview:** usa el boton nativo "Audio Overview" de NotebookLM para un repaso escuchando (ideal en commute).

6. **Conexion certificacion:** "Que preguntas de certificacion HL7 FHIR podrian salir de este material? Indica dominio y dificultad."

7. **Errores comunes:** "Lista los 5 malentendidos mas frecuentes sobre {tema} y como corregirlos."
"""


def prompts_notebooklm(num: int, tema: str) -> str:
    return prompts_notebooklm_etiqueta(f"el Dia {num}", tema)


def exportar_dia(num: int, notas: Path | None = None) -> Path:
    carpeta = carpeta_dia(num)
    if not carpeta.is_dir():
        raise FileNotFoundError(f"No existe {carpeta}")

    readme = carpeta / "README.md"
    quiz_path = carpeta / "quiz.json"
    if not readme.exists():
        raise FileNotFoundError(f"Falta README en {carpeta}")

    leccion = leccion_sin_prompt_composer(readme.read_text(encoding="utf-8"))
    quiz = cargar_json(quiz_path) if quiz_path.exists() else {}
    tema = quiz.get("tema", f"Dia {num}")
    practica = archivos_practica(carpeta)
    dominios = dominios_certificacion(num)

    secciones = [
        f"# Dia {num:02d} — {tema}",
        "",
        f"> Material de estudio para **NotebookLM**. Laboratorio FHIR Aprendizaje.",
        f"> Generado: {date.today().isoformat()}",
        "",
        "## Como usar este documento en NotebookLM",
        "",
        "1. Ve a [notebooklm.google.com](https://notebooklm.google.com) y crea un cuaderno nuevo.",
        "2. Sube este archivo `.md` (o copia todo el texto como fuente pegada).",
        "3. Opcional: anade 1-2 fuentes oficiales (enlace HL7 o GCP del dia). Maximo ~50 fuentes por cuaderno.",
        "4. Usa los prompts sugeridos al final o genera un **Audio Overview**.",
        "5. **No subas** credenciales, tokens ni `historial.csv` personal.",
        "",
        "## Certificaciones relacionadas",
        "",
        *(dominios or ["- Consulta `evaluacion/blueprints.json` para dominios."]),
        "",
        "---",
        "",
        "## Leccion",
        "",
        leccion,
        "",
        "---",
        "",
        "## Practica (codigo y guias)",
        "",
        bloque_practica(practica, carpeta),
        "",
        "---",
        "",
        "## Quiz del dia (repaso con respuestas)",
        "",
        formatear_quiz(quiz) if quiz else "_Sin quiz._",
        "",
        "---",
        "",
        "## Flashcards (repaso espaciado)",
        "",
        formatear_flashcards(num),
        "",
    ]

    if notas and notas.exists():
        secciones.extend([
            "---",
            "",
            "## Mis notas personales",
            "",
            notas.read_text(encoding="utf-8").strip(),
            "",
        ])

    secciones.extend([
        "---",
        "",
        "## Prompts sugeridos para NotebookLM",
        "",
        prompts_notebooklm(num, tema),
    ])

    DIR_EXPORTS.mkdir(parents=True, exist_ok=True)
    destino = DIR_EXPORTS / f"dia-{num:02d}-notebooklm.md"
    destino.write_text("\n".join(secciones), encoding="utf-8")
    return destino


def exportar_extra(slug: str, notas: Path | None = None) -> Path:
    carpeta = carpeta_extra(slug)
    if not carpeta.is_dir():
        raise FileNotFoundError(f"No existe {carpeta}")

    readme = carpeta / "README.md"
    quiz_path = carpeta / "quiz.json"
    if not readme.exists():
        raise FileNotFoundError(f"Falta README en {carpeta}")

    leccion = leccion_sin_prompt_composer(readme.read_text(encoding="utf-8"))
    quiz = cargar_json(quiz_path) if quiz_path.exists() else {}
    tema = quiz.get("tema", slug)
    modulo_id = quiz.get("modulo", carpeta.name)
    practica = archivos_practica(carpeta)

    secciones = [
        f"# Extra — {tema}",
        "",
        f"> Material de estudio para **NotebookLM**. Laboratorio FHIR Aprendizaje.",
        f"> Modulo: `{modulo_id}` | Generado: {date.today().isoformat()}",
        "",
        "## Como usar este documento en NotebookLM",
        "",
        "1. Ve a [notebooklm.google.com](https://notebooklm.google.com) y crea un cuaderno (ej. `FHIR Historia`).",
        "2. Sube este `.md` y opcionalmente la pagina HL7 FHIR Confluence.",
        "3. Genera **Audio Overview** para repasar la cronologia escuchando.",
        "",
        "## Certificaciones relacionadas",
        "",
        "- **foundational** — contexto historico y comprension del estandar (preguntas conceptuales)",
        "",
        "---",
        "",
        "## Leccion",
        "",
        leccion,
        "",
        "---",
        "",
        "## Practica (codigo y guias)",
        "",
        bloque_practica(practica, carpeta),
        "",
        "---",
        "",
        "## Quiz del modulo (repaso con respuestas)",
        "",
        formatear_quiz(quiz) if quiz else "_Sin quiz._",
        "",
        "---",
        "",
        "## Flashcards (repaso espaciado)",
        "",
        formatear_flashcards(modulo=modulo_id),
        "",
    ]

    if notas and notas.exists():
        secciones.extend([
            "---",
            "",
            "## Mis notas personales",
            "",
            notas.read_text(encoding="utf-8").strip(),
            "",
        ])

    secciones.extend([
        "---",
        "",
        "## Prompts sugeridos para NotebookLM",
        "",
        prompts_notebooklm_etiqueta("Historia de FHIR", tema),
    ])

    DIR_EXPORTS.mkdir(parents=True, exist_ok=True)
    nombre = carpeta.name.replace("extra-", "extra-") + "-notebooklm.md"
    destino = DIR_EXPORTS / nombre
    destino.write_text("\n".join(secciones), encoding="utf-8")
    return destino


def main() -> None:
    parser = argparse.ArgumentParser(description="Exportar dia(s) o modulos extra a Markdown para NotebookLM")
    parser.add_argument("--dia", type=int, help="Numero de dia (1-20)")
    parser.add_argument("--extra", type=str, metavar="SLUG", help="Modulo extra (ej. historia-fhir)")
    parser.add_argument("--desde", type=int, help="Primer dia de un rango")
    parser.add_argument("--hasta", type=int, help="Ultimo dia de un rango")
    parser.add_argument("--notas", type=Path, help="Archivo markdown con tus notas")
    args = parser.parse_args()

    generados: list[Path] = []

    if args.extra:
        dest = exportar_extra(args.extra, args.notas)
        generados.append(dest)
        print(f"OK  {dest.relative_to(RAIZ)}")
    elif args.dia:
        dest = exportar_dia(args.dia, args.notas)
        generados.append(dest)
        print(f"OK  {dest.relative_to(RAIZ)}")
    elif args.desde and args.hasta:
        for d in range(args.desde, args.hasta + 1):
            dest = exportar_dia(d)
            generados.append(dest)
            print(f"OK  {dest.relative_to(RAIZ)}")
    else:
        parser.error("Indica --dia N, --extra SLUG o --desde X --hasta Y")

    print(f"\n{len(generados)} archivo(s) listo(s) en evaluacion/exports/")
    print("Subelos a NotebookLM o abre el .md y copia el contenido como fuente.")


if __name__ == "__main__":
    main()
