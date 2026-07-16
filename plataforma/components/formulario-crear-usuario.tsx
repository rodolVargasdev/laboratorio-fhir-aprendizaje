"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { crearUsuario } from "@/lib/acciones";

export function FormularioCrearUsuario() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setEstado(null);
    const r = await crearUsuario({ email, nombre, password });
    setCargando(false);
    if (r.ok) {
      setEstado({ tipo: "ok", msg: `Usuario ${email} creado. Ya puede entrar con su correo y contrasena.` });
      setEmail(""); setNombre(""); setPassword("");
      router.refresh();
    } else {
      setEstado({ tipo: "error", msg: r.error ?? "Error" });
    }
  }

  const clase = "h-11 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Nombre</span>
          <input className={clase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Correo</span>
          <input className={clase} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" required />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">Contrasena inicial (min. 8 caracteres)</span>
        <input className={clase} type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="La comparte con la persona; puede cambiarla despues" minLength={8} required />
      </label>
      <div className="flex items-center gap-3">
        <Boton type="submit" disabled={cargando}>
          <UserPlus className="h-4 w-4" /> {cargando ? "Creando…" : "Crear usuario"}
        </Boton>
        {estado && (
          <span className={estado.tipo === "ok" ? "text-sm text-success" : "text-sm text-danger"}>{estado.msg}</span>
        )}
      </div>
    </form>
  );
}
