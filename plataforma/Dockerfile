# Imagen para Cloud Run (Next.js standalone, multi-stage).

FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# openssl es requerido por Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# ---- deps: instala dependencias ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall corre "prisma generate"
RUN npm ci

# ---- builder: compila la app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

# ---- runner: imagen final minima ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Salida standalone de Next + estaticos + cliente Prisma generado.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
