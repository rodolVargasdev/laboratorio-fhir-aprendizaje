import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida standalone para empaquetar en Docker y desplegar en Cloud Run.
  output: "standalone",
  // Fija la raiz del proyecto (hay otros lockfiles en el sistema) para el trazado
  // de archivos del build standalone.
  turbopack: {
    root: import.meta.dirname,
  },
  // El cliente de Prisma se genera en /generated; no lo empaquete el bundler del server.
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;
