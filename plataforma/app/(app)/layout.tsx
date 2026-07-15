import { redirect } from "next/navigation";
import Link from "next/link";
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
          <MenuUsuario
            nombre={sesion.user.name}
            email={sesion.user.email}
          />
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
