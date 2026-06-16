# Laboratorio de aprendizaje: cimientos de software para FHIR (Google Cloud first)

Tu laboratorio personal para prepararte, en 2 semanas intensivas y luego durante
el resto del anio, para estudiar el estandar HL7 FHIR de cara a la certificacion,
desde el rol de desarrollador e implementador de DoctorSV El Salvador.

## Idea central

Las 2 semanas construyen los CIMIENTOS de software que el examen da por sabidos
(JSON, REST, seguridad, terminologias, modelo FHIR) y dejan montado el entorno
(servidor FHIR local gratis o Cloud Healthcare API en capa gratuita). Despues, el
plan del resto del anio acumula la experiencia practica que HL7 recomienda antes
del examen.

Metodologia con evidencia: recuperacion activa + repeticion espaciada +
intercalado, con medicion objetiva de tu dominio. Detalle en
`METODOLOGIA-APRENDIZAJE.md`.

## Como se mide que SI aprendiste (objetivo, con numeros)

- Quiz diario auto-corregido con umbral de maestria (80%) y desglose por nivel de
  Bloom: `python evaluacion\quiz_runner.py --dia N`
- Repaso espaciado con cajas de Leitner (micro-aprendizaje):
  `python evaluacion\repaso.py`
- Calculador de PREPARACION para las 3 certificaciones, con puntaje compuesto y
  semaforo (te dice objetivamente si estas listo para agendar):
  `python evaluacion\preparacion.py`
- Historial de resultados en `evaluacion/resultados/historial.csv`.

## Por donde empezar

1. Lee `00-setup/README.md` y deja tu entorno listo (una sola vez).
2. Lee `COMO-USAR-CON-COMPOSER.md` (como estudiar cada dia con Composer 2.5).
3. Empieza por `dias/dia-01/README.md` y avanza un dia por jornada.
4. Apunta tu progreso en `PROGRESO.md`.

## Estructura del workspace

- `dias/dia-01` ... `dias/dia-20/` Un dia por carpeta (20 modulos). Cada uno tiene:
  - `README.md` leccion + practica + reto Feynman + "Prompt para Composer 2.5".
  - `quiz.json` evaluacion objetiva del dia.
  - `practica/` scripts y guias ejecutables.
- `evaluacion/` motor de quizzes (`quiz_runner.py`), repaso espaciado
  (`repaso.py`), calculador de preparacion (`preparacion.py`), planos de examen
  (`blueprints.json`), registro de competencias (`competencias.json`) y mazo de
  tarjetas (`flashcards.json`).
- `00-setup/` preparacion del entorno.
- `recursos/` enlaces oficiales y servidores de practica.
- `METODOLOGIA-APRENDIZAJE.md` como aprendemos y como medimos el dominio.
- `COMO-USAR-CON-COMPOSER.md` flujo diario con Composer 2.5.
- `PLAN-2-SEMANAS.md` calendario de las 2 semanas.
- `PLAN-RESTO-DEL-ANIO.md` hoja de ruta de varios meses hacia el examen.
- `MICRO-APRENDIZAJE.md` rutinas de 5-15 min para dias ocupados.
- `PROGRESO.md` tu tablero de control.

## Costo

- Semana 1: $0 (servidores publicos de prueba).
- Semana 2: $0 con servidor HAPI local, o $0 con la capa gratuita de Cloud
  Healthcare API (25,000 peticiones/mes y 1 GiB-hora/mes). Incluye guia de
  limpieza para no gastar.

## Seguridad

Todo es local y gratuito. El `.gitignore` excluye claves y secretos. Usa SIEMPRE
datos ficticios: nunca subas datos reales de pacientes a servidores de practica.

## Clonar en otro dispositivo (PC, laptop, etc.)

1. Instala Git y Python 3.9+ en el nuevo equipo.
2. Clona el repositorio:

   ```powershell
   git clone https://github.com/rodolVargasdev/laboratorio-fhir-aprendizaje.git
   cd laboratorio-fhir-aprendizaje
   ```

3. Crea y activa el entorno virtual:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

4. Verifica: `python 00-setup\verificar_entorno.py`
5. Abre la carpeta en Cursor y continua desde `dias/dia-XX/README.md` y tu
   `PROGRESO.md` (si lo subiste; el historial local de quizzes no se sube a git
   por privacidad, solo el codigo y material del lab).

En Linux/macOS usa `source .venv/bin/activate` en lugar del script de PowerShell.
