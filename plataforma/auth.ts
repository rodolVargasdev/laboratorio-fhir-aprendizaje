import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/** Correo del unico administrador (puede crear usuarios). */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

/** Login de prueba sin contrasena SOLO en desarrollo. */
const devLoginHabilitado =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_ENABLE_DEV_LOGIN === "true";

function normalizar(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),

    // Correo + contrasena: valido en produccion. Autentica contra el hash del usuario.
    // Funciona "anidado" a Google: si el usuario ya existe (creado por el admin o por un
    // login previo con Google), puede entrar tambien con su contrasena una vez definida.
    Credentials({
      id: "password",
      name: "Correo y contrasena",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(cred) {
        const email = normalizar(cred?.email as string);
        const password = String(cred?.password ?? "");
        if (!email || !password) return null;
        const u = await prisma.user.findUnique({ where: { email } });
        if (!u || !u.password) return null;
        const ok = await bcrypt.compare(password, u.password);
        if (!ok) return null;
        return { id: u.id, email: u.email, name: u.name, image: u.image, rol: u.rol };
      },
    }),

    // Acceso de prueba (solo local): entra por correo sin contrasena.
    ...(devLoginHabilitado
      ? [
          Credentials({
            id: "dev",
            name: "Acceso de desarrollo",
            credentials: { email: { label: "Correo", type: "email" } },
            async authorize(cred) {
              const email = normalizar(cred?.email as string);
              if (!email) return null;
              const u = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                  email,
                  name: email.split("@")[0],
                  rol: email === ADMIN_EMAIL ? "ADMIN" : "ESTUDIANTE",
                },
              });
              return { id: u.id, email: u.email, name: u.name, rol: u.rol };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    // Google: solo entran el admin o usuarios YA creados por el admin. Los credentials
    // ya se validaron en authorize.
    async signIn({ user, account }) {
      if (account?.provider === "password" || account?.provider === "dev") return true;
      const email = normalizar(user.email);
      if (!email) return false;
      if (email === ADMIN_EMAIL) return true;
      const existe = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      return !!existe;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.id;
        const email = normalizar((user.email as string) ?? (token.email as string));
        if (email === ADMIN_EMAIL) {
          token.rol = "ADMIN";
          // Asegura el rol ADMIN en la BD (idempotente, solo al iniciar sesion).
          await prisma.user.updateMany({ where: { email }, data: { rol: "ADMIN" } });
        } else {
          token.rol = (user as { rol?: string }).rol ?? "ESTUDIANTE";
        }
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
