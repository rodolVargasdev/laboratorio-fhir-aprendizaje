# Como estudiar cada dia usando Composer 2.5 de Cursor como tu guia

Cada dia tiene su propia carpeta en `dias/dia-XX/` con un archivo `README.md`
que es, a la vez, tu leccion y el manual para que Composer actue como tu tutor.

La idea: tu no estudias solo. Abres el dia, le pasas a Composer el "Prompt para
Composer" que viene dentro del README de ese dia, y Composer te guia, te explica
con tus dudas, te toma mini-pruebas orales y te corrige.

## Flujo recomendado (cada dia)

1. Abre Cursor en este workspace.
2. Cambia el modelo del chat a Composer 2.5 (selector de modelo del chat).
3. Abre el archivo del dia, por ejemplo `dias/dia-01/README.md`.
4. Copia el bloque "Prompt para Composer" que esta al final de ese README y
   pegalo en el chat. Ese prompt le dice a Composer que rol tomar y que hacer.
5. Sigue la conversacion: Composer te explicara, te hara preguntas de
   recuperacion activa y te dejara practicar.
6. Cuando Composer te lo indique, corre la practica y el quiz del dia en la
   terminal (ver abajo).

## Por que el prompt esta dentro de cada dia

Asi cada manual le da a Composer el contexto exacto de ese dia: objetivos,
conceptos, errores comunes y como evaluarte. No tienes que recordar nada; solo
copiar y pegar.

## Comandos que usaras cada dia (en la terminal de Cursor / PowerShell)

Activar el entorno (una vez por sesion de terminal):

```powershell
cd C:\Users\JOSE-\applications_local_env\aprendizaje
.\.venv\Scripts\Activate.ps1
```

Repaso espaciado (al empezar, 5-10 min):

```powershell
python evaluacion\repaso.py
```

Quiz del dia (al terminar; cambia el numero de dia):

```powershell
python evaluacion\quiz_runner.py --dia 1
```

Quiz en modo intercalado (mezcla varios dias, ideal para consolidar):

```powershell
python evaluacion\quiz_runner.py --repaso
```

## Consejo de uso de Composer

- Pidele que NO te de la respuesta de inmediato: que primero te haga preguntas y
  te deje intentar (eso es recuperacion activa, lo que de verdad fija memoria).
- Usa la tecnica Feynman: explicale el concepto con tus palabras y pidele que
  detecte errores o vacios.

## Repaso con NotebookLM (despues del dia)

Cuando termines la practica y el quiz, exporta el material para estudiar en
[NotebookLM](https://notebooklm.google.com):

```powershell
python evaluacion\export_notebooklm.py --dia 1
```

Guia completa: `NOTEBOOKLM.md`.
- Si algo no te queda claro, dile "explicamelo como si tuviera 12 anios" y luego
  sube el nivel.

## Donde anotar tu progreso

Apunta el porcentaje del quiz y tus dudas en `PROGRESO.md`. Es tu evidencia
objetiva de avance a lo largo del anio.
