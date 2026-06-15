# Dia 8: Google Cloud - cuenta, proyecto y como NO gastar

Objetivo: dejar listo GCP para practicar FHIR sin gastar (o como mucho centavos),
y tener un plan B 100% gratis con un servidor FHIR local.
Tiempo: 2-3 horas. Costo objetivo: $0.

## Importante sobre tu situacion (sin creditos)

Como tu cuenta ya no tiene credito de bienvenida, seguimos esta regla de oro:

- Cloud Healthcare API tiene CAPA GRATUITA permanente: 25,000 peticiones/mes y
  1 GiB-hora/mes de almacenamiento. Para aprender, cabes de sobra en lo gratis.
- Aun asi, GCP pedira una tarjeta para verificar identidad. No se cobra sin que
  superes la capa gratuita y tengas facturacion activa.
- Plan B garantizado a $0: levantar un servidor FHIR HAPI en tu propia maquina
  (ver `practica/servidor-local.md`). No toca GCP en absoluto.

Recomendacion: hoy elige UNA via.
- Via A (nube, gratis con disciplina): util para tu mentalidad GCP-first.
- Via B (local, cero riesgo de cobro): util si prefieres no dar tarjeta.

Ambas sirven para los dias 9-13. Las practicas leen la variable de entorno
`FHIR_BASE_URL`, asi que funcionan con cualquiera de las dos.

## Rutina

1. `python evaluacion\repaso.py`.
2. Leccion + elegir via.
3. Practica (configurar la via elegida).
4. Reto Feynman.
5. `python evaluacion\quiz_runner.py --dia 8`.

## Teoria: jerarquia de GCP

Organizacion > Proyecto > Recursos. Todo recurso (incluido un FHIR store) vive
dentro de un proyecto. La facturacion se asocia al proyecto.

Herramienta: `gcloud` (CLI de Google Cloud) te deja controlar GCP desde la
terminal.

## Practica

- Via A (nube): sigue `practica/gcp-cuenta.md` (crear proyecto, instalar gcloud,
  poner alertas de presupuesto en $1 como red de seguridad).
- Via B (local): sigue `practica/servidor-local.md` (HAPI FHIR con Docker, gratis).

Comprueba tu gcloud (si elegiste Via A):

```powershell
python dias\dia-08\practica\comprobar_gcloud.py
```

## Reto Feynman

En `PROGRESO.md`, explica la jerarquia de GCP (organizacion/proyecto/recurso) y
por que la capa gratuita de Healthcare API te alcanza para aprender.

## Prompt para Composer 2.5 (copia y pega)

Actua como mi tutor del Dia 8. Tema: poner a punto Google Cloud sin gastar (mi
cuenta no tiene creditos) o usar un servidor FHIR local gratis. Soy desarrollador
intermedio, en espanol, mentalidad GCP-first. Guiame a decidir entre la via nube
(capa gratuita de Cloud Healthcare API: 25,000 req/mes y 1 GiB-hora gratis, con
alerta de presupuesto en 1 dolar) y la via local (HAPI FHIR en Docker). Hazme
preguntas para ver si entiendo la jerarquia de GCP y la capa gratuita, sin darme
las respuestas directo. Avisame de cualquier paso que pudiera generar cobros. Al
final pideme que explique como evitar cobros (Feynman).
