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
  // Cache del router en cliente: las rutas dinamicas (todas usan auth/BD) por defecto
  // NO se cachean, asi que cada click y cada "volver" hace un viaje al servidor. Con
  // esto, un segmento visitado se reutiliza sin refetch durante la ventana indicada:
  // navegar hacia atras/adelante y revisitar es instantaneo.
  experimental: {
    staleTimes: {
      dynamic: 60, // segundos que se reutiliza una pagina dinamica ya visitada
      static: 300, // paginas estaticas / con prefetch completo
    },
  },
};

export default nextConfig;
