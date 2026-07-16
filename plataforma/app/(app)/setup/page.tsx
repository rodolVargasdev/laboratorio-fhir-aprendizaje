import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Setup del workspace" };

const CONTENIDO = `## 1. Que vas a necesitar (una sola vez)

Para los ejercicios que se hacen en tu computadora (no todos: muchos ya se hacen en el
[Laboratorio](/laboratorio) del navegador). Instala esto:

| Herramienta | Para que | Donde |
|---|---|---|
| **Python 3.11+** | Correr los scripts de practica | [python.org/downloads](https://www.python.org/downloads/) — marca "Add Python to PATH" |
| **Git** | Descargar y actualizar los archivos de practica | [git-scm.com](https://git-scm.com/) |
| **Un editor** | Ver y editar codigo (recomendado VS Code o Cursor) | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Una terminal** | Escribir los comandos | PowerShell (Windows) o Terminal (Mac/Linux), ya vienen |

> **En simple:** instalar = descargar y darle siguiente. Si algo falla, copia el error
> y preguntale al Tutor.

## 2. Preparar la carpeta de trabajo (una vez)

Abre tu terminal y ejecuta, linea por linea:

\`\`\`bash
# 1. Descarga los archivos de practica
git clone https://github.com/rodolVargasdev/laboratorio-fhir-aprendizaje.git
cd laboratorio-fhir-aprendizaje

# 2. Crea un entorno de Python aislado (venv)
python -m venv .venv

# 3. Activalo
#   Windows (PowerShell):
.\\.venv\\Scripts\\Activate.ps1
#   Mac / Linux:
source .venv/bin/activate

# 4. Instala las dependencias
pip install -r legacy/requirements.txt
\`\`\`

Si ves \`(.venv)\` al inicio de la linea, tu entorno esta activo. Los scripts de practica
estan en \`legacy/dias/\`.

## 3. Cada vez que practiques en la PC

\`\`\`bash
cd laboratorio-fhir-aprendizaje
.\\.venv\\Scripts\\Activate.ps1     # Windows  (Mac/Linux: source .venv/bin/activate)
\`\`\`

Y ya puedes correr un ejercicio, por ejemplo:

\`\`\`bash
python legacy/dias/dia-01/practica/ejercicio_1_local.py
\`\`\`

## 4. Solo para los temas de Google Cloud (Etapa 3)

Esos temas usan la capa **gratuita** de Google Cloud. Necesitas ademas:

- Una cuenta de Google Cloud (capa gratuita): [cloud.google.com/free](https://cloud.google.com/free)
- La herramienta **gcloud** (Google Cloud CLI): [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

Al terminar cada sesion en la nube, sigue la guia de limpieza del tema para mantener el
costo en **cero**. El tutor te acompana en cada paso.

---

> **Regla de oro:** un error en la terminal es informacion, no un desastre. Leelo con
> calma o pasaselo al Tutor. Nunca te vas a quedar sin saber que hacer.
`;

export default function SetupPage() {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>
      <header className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Setup del workspace</h1>
          <p className="text-sm text-muted-foreground">
            Prepara tu computadora una sola vez para los ejercicios que no son de navegador.
          </p>
        </div>
      </header>
      <Markdown>{CONTENIDO}</Markdown>
    </div>
  );
}
