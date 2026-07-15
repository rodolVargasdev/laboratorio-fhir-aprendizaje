-- CreateEnum
CREATE TYPE "TipoPaso" AS ENUM ('LECTURA', 'NOTEBOOKLM', 'PRACTICA', 'QUIZ', 'PRACTICA_NACIONAL', 'TARJETAS');

-- CreateEnum
CREATE TYPE "TipoPregunta" AS ENUM ('OPCION_MULTIPLE', 'VERDADERO_FALSO', 'RESPUESTA_CORTA');

-- CreateEnum
CREATE TYPE "EstadoTema" AS ENUM ('NO_INICIADO', 'EN_PROGRESO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "etapas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "meta" TEXT,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "resumen" TEXT,
    "opcional" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,
    "objetivos" TEXT[],
    "enlaces" JSONB,
    "notebooklm" JSONB,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasos" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "tipo" "TipoPaso" NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT,
    "orden" INTEGER NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "claveLegacy" TEXT,
    "tipo" "TipoPregunta" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opciones" JSONB,
    "respuestaIndice" INTEGER,
    "respuestaBool" BOOLEAN,
    "respuestasValidas" TEXT[],
    "explicacion" TEXT,
    "bloom" TEXT,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarjetas" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "claveLegacy" TEXT,
    "frente" TEXT NOT NULL,
    "reverso" TEXT NOT NULL,

    CONSTRAINT "tarjetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_temas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "estado" "EstadoTema" NOT NULL DEFAULT 'NO_INICIADO',
    "completadoEn" TIMESTAMP(3),
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progreso_temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_pasos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pasoId" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "datos" JSONB,
    "completadoEn" TIMESTAMP(3),
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progreso_pasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intentos_quiz" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "aciertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "detalle" JSONB,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estadisticas_pregunta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "vecesVista" INTEGER NOT NULL DEFAULT 0,
    "vecesFallada" INTEGER NOT NULL DEFAULT 0,
    "vecesAcertada" INTEGER NOT NULL DEFAULT 0,
    "ultima" TIMESTAMP(3),

    CONSTRAINT "estadisticas_pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repaso_tarjetas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tarjetaId" TEXT NOT NULL,
    "caja" INTEGER NOT NULL DEFAULT 1,
    "factorFacilidad" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalo" INTEGER NOT NULL DEFAULT 0,
    "repeticiones" INTEGER NOT NULL DEFAULT 0,
    "proximaRevision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repaso_tarjetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones_tutor" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "temaId" TEXT,
    "titulo" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_tutor" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_tutor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "etapas_slug_key" ON "etapas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "temas_slug_key" ON "temas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pasos_temaId_tipo_key" ON "pasos"("temaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "progreso_temas_usuarioId_temaId_key" ON "progreso_temas"("usuarioId", "temaId");

-- CreateIndex
CREATE UNIQUE INDEX "progreso_pasos_usuarioId_pasoId_key" ON "progreso_pasos"("usuarioId", "pasoId");

-- CreateIndex
CREATE INDEX "intentos_quiz_usuarioId_temaId_idx" ON "intentos_quiz"("usuarioId", "temaId");

-- CreateIndex
CREATE UNIQUE INDEX "estadisticas_pregunta_usuarioId_preguntaId_key" ON "estadisticas_pregunta"("usuarioId", "preguntaId");

-- CreateIndex
CREATE INDEX "repaso_tarjetas_usuarioId_proximaRevision_idx" ON "repaso_tarjetas"("usuarioId", "proximaRevision");

-- CreateIndex
CREATE UNIQUE INDEX "repaso_tarjetas_usuarioId_tarjetaId_key" ON "repaso_tarjetas"("usuarioId", "tarjetaId");

-- CreateIndex
CREATE INDEX "diagnosticos_usuarioId_idx" ON "diagnosticos"("usuarioId");

-- CreateIndex
CREATE INDEX "conversaciones_tutor_usuarioId_idx" ON "conversaciones_tutor"("usuarioId");

-- CreateIndex
CREATE INDEX "mensajes_tutor_conversacionId_idx" ON "mensajes_tutor"("conversacionId");

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pasos" ADD CONSTRAINT "pasos_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_temas" ADD CONSTRAINT "progreso_temas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_temas" ADD CONSTRAINT "progreso_temas_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_pasos" ADD CONSTRAINT "progreso_pasos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_pasos" ADD CONSTRAINT "progreso_pasos_pasoId_fkey" FOREIGN KEY ("pasoId") REFERENCES "pasos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_quiz" ADD CONSTRAINT "intentos_quiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intentos_quiz" ADD CONSTRAINT "intentos_quiz_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estadisticas_pregunta" ADD CONSTRAINT "estadisticas_pregunta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estadisticas_pregunta" ADD CONSTRAINT "estadisticas_pregunta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repaso_tarjetas" ADD CONSTRAINT "repaso_tarjetas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repaso_tarjetas" ADD CONSTRAINT "repaso_tarjetas_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "tarjetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones_tutor" ADD CONSTRAINT "conversaciones_tutor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_tutor" ADD CONSTRAINT "mensajes_tutor_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "conversaciones_tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
