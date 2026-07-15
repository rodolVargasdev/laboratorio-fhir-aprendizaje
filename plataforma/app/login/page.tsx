import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Marca } from "@/components/marca";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";
import { FormularioLogin } from "@/components/formulario-login";

export const metadata: Metadata = { title: "Iniciar sesion" };

const devHabilitado =
  process.env.NODE_ENV !== "production" &&
  process.env.AUTH_ENABLE_DEV_LOGIN === "true";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sesion = await auth();
  const { callbackUrl } = await searchParams;
  const destino = callbackUrl ?? "/panel";

  if (sesion?.user) redirect(destino);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Marca className="text-2xl" />
          <p className="text-sm text-muted-foreground">
            Aprende HL7 FHIR paso a paso, a tu ritmo.
          </p>
        </div>

        <Tarjeta>
          <TarjetaContenido className="flex flex-col gap-5">
            <div>
              <h1 className="text-lg font-bold">Entrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa tu cuenta de Google autorizada para acceder.
              </p>
            </div>
            <FormularioLogin devHabilitado={devHabilitado} callbackUrl={destino} />
          </TarjetaContenido>
        </Tarjeta>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          El acceso esta limitado a los correos autorizados del equipo.
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/como-funciona" className="font-semibold text-primary hover:underline">
            Como funciona la plataforma
          </Link>
        </p>
      </div>
    </main>
  );
}
