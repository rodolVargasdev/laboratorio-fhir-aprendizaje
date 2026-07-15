import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Cliente Prisma (Prisma 7 usa driver adapter). Se comparte una sola instancia
 * en desarrollo para no agotar conexiones con el hot-reload de Next.
 */
const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function crearCliente() {
  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copia .env.example a .env y configura la conexion a Postgres."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
