import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Cliente Prisma (Prisma 7 usa driver adapter). Se crea de forma PEREZOSA: la
 * instancia y la conexion solo se resuelven en el primer uso (runtime), nunca al
 * importar el modulo. Esto permite que `next build` recopile las rutas sin
 * DATABASE_URL (los secretos existen solo en tiempo de ejecucion en Cloud Run).
 * Se comparte una sola instancia en desarrollo para no agotar conexiones con el hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let instancia: PrismaClient | undefined;

function obtenerCliente(): PrismaClient {
  if (instancia) return instancia;
  if (globalForPrisma.prisma) {
    instancia = globalForPrisma.prisma;
    return instancia;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. En local copia .env.example a .env; en produccion configura el secreto."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  instancia = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = instancia;
  }
  return instancia;
}

// Proxy: difiere la creacion del cliente hasta el primer acceso a una propiedad.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const cliente = obtenerCliente();
    const valor = Reflect.get(cliente as object, prop);
    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
