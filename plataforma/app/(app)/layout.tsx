import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, CircleHelp, Users } from "lucide-react";
import { auth } from "@/auth";
import { Marca } from "@/components/marca";
import { MenuUsuario } from "@/components/menu-usuario";
import { NavInferior } from "@/components/nav-inferior";
import { TutorPanel } from "@/components/tutor-panel";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/panel" className="text-lg">
            <Marca />
          </Link>
          <div className="flex items-center gap-2">
            {sesion.user.rol === "ADMIN" && (
              <>
                <Link
                  href="/admin/reportes"
                  title="Reportes de progreso"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Reportes</span>
                </Link>
                <Link
                  href="/admin/usuarios"
                  title="Gestionar usuarios"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuarios</span>
                </Link>
              </>
            )}
            <Link
              href="/como-funciona"
              title="Como funciona la plataforma"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CircleHelp className="h-4 w-4" />
              <span className="hidden sm:inline">Guia</span>
            </Link>
            <MenuUsuario
              nombre={sesion.user.name}
              email={sesion.user.email}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <TutorPanel />
      <NavInferior />
    </div>
  );
}
