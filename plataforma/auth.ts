import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { esCorreoPermitido } from "@/lib/allowlist";

/**
 * Login de prueba SOLO en desarrollo, para poder verificar el flujo sin las
 * credenciales de Google. En produccion no existe (el proveedor no se registra).
 */
const devLoginHabilitado =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_ENABLE_DEV_LOGIN === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    ...(devLoginHabilitado
      ? [
          Credentials({
            id: "dev",
            name: "Acceso de desarrollo",
            credentials: {
              email: { label: "Correo", type: "email" },
            },
            async authorize(cred) {
              const email = String(cred?.email ?? "").trim().toLowerCase();
              if (!email) return null;
              // Crea/recupera un usuario real para tener un id estable en la BD.
              const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: { email, name: email.split("@")[0], rol: "ADMIN" },
              });
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // El login de prueba ya valido; para OAuth aplicamos la lista blanca.
      if (account?.provider === "dev") return true;
      return esCorreoPermitido(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // El rol viene del usuario en BD (dev) o se asigna por defecto.
        token.rol = (user as { rol?: string }).rol ?? "ESTUDIANTE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.rol = (token.rol as string) ?? "ESTUDIANTE";
      }
      return session;
    },
  },
});
