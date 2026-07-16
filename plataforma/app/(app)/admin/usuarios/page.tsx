import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Tarjeta, TarjetaContenido, TarjetaTitulo } from "@/components/ui/card";
import { FormularioCrearUsuario } from "@/components/formulario-crear-usuario";

export const metadata: Metadata = { title: "Usuarios" };

export default async function AdminUsuariosPage() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  if (sesion.user.rol !== "ADMIN") redirect("/panel");

  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, rol: true, password: true, createdAt: true },
  });

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
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-semibold">Nombre</th>
                  <th className="pb-2 pr-3 font-semibold">Correo</th>
                  <th className="pb-2 pr-3 font-semibold">Rol</th>
                  <th className="pb-2 font-semibold">Contrasena</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="py-2 pr-3">{u.name ?? "-"}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        {u.rol === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                        {u.rol === "ADMIN" ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{u.password ? "definida" : "solo Google"}</td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr><td colSpan={4} className="py-3 text-muted-foreground">Aun no hay usuarios.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}
