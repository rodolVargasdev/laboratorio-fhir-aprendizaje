import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Tarjeta, TarjetaContenido, TarjetaTitulo } from "@/components/ui/card";
import { FormularioCrearUsuario } from "@/components/formulario-crear-usuario";
import { GestionUsuarios } from "@/components/gestion-usuarios";

export const metadata: Metadata = { title: "Usuarios" };

export default async function AdminUsuariosPage() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  if (sesion.user.rol !== "ADMIN") redirect("/panel");

  const filas = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, rol: true, password: true, createdAt: true },
  });
  // No exponemos el hash al cliente: solo si tiene contrasena definida.
  const usuarios = filas.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    rol: u.rol as "ADMIN" | "ESTUDIANTE",
    tienePassword: !!u.password,
  }));
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/panel" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <header className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Solo tu (administrador) puedes crear usuarios. Cada usuario entra con su correo y
            contrasena, o con Google usando el mismo correo.
          </p>
        </div>
      </header>

      <Tarjeta>
        <TarjetaContenido className="flex flex-col gap-4">
          <TarjetaTitulo>Crear un usuario nuevo</TarjetaTitulo>
          <FormularioCrearUsuario />
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta>
        <TarjetaContenido>
          <TarjetaTitulo>Usuarios registrados ({usuarios.length})</TarjetaTitulo>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">
            Edita nombre, correo, rol o restablece la contrasena. Tu propia cuenta y el
            administrador principal estan protegidos para evitar bloqueos.
          </p>
          <GestionUsuarios usuarios={usuarios} miId={sesion.user.id} adminEmail={adminEmail} />
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}
