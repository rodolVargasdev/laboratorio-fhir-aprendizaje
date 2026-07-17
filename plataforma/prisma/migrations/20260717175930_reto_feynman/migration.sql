-- AlterEnum
ALTER TYPE "TipoPaso" ADD VALUE 'FEYNMAN';

-- CreateTable
CREATE TABLE "retos_feynman" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "explicacion" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "veredicto" TEXT NOT NULL,
    "fortalezas" TEXT[],
    "brechas" TEXT[],
    "sugerencias" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retos_feynman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "retos_feynman_usuarioId_temaId_idx" ON "retos_feynman"("usuarioId", "temaId");

-- AddForeignKey
ALTER TABLE "retos_feynman" ADD CONSTRAINT "retos_feynman_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retos_feynman" ADD CONSTRAINT "retos_feynman_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
