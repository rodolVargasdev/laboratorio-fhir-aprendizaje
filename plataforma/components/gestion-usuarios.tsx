"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, ShieldCheck, Loader2 } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { actualizarUsuario, eliminarUsuario } from "@/lib/acciones";

export type UsuarioFila = {
  id: string;
  name: string | null;
  email: string | null;
  rol: "ADMIN" | "ESTUDIANTE";
  tienePassword: boolean;
};

export function GestionUsuarios({
  usuarios,
  miId,
  adminEmail,
}: {
  usuarios: UsuarioFila[];
  miId: string;
  adminEmail: string;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-2 rounded-md bg-danger-soft/50 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-3 font-semibold">Nombre</th>
            <th className="pb-2 pr-3 font-semibold">Correo</th>
            <th className="pb-2 pr-3 font-semibold">Rol</th>
            <th className="pb-2 pr-3 font-semibold">Contrasena</th>
            <th className="pb-2 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) =>
            editando === u.id ? (
              <FilaEdicion
                key={u.id}
                usuario={u}
                miId={miId}
                adminEmail={adminEmail}
                onCancelar={() => setEditando(null)}
                onGuardado={() => {
                  setEditando(null);
                  setError(null);
                }}
                onError={setError}
              />
            ) : (
              <FilaLectura
                key={u.id}
                usuario={u}
                miId={miId}
                adminEmail={adminEmail}
                onEditar={() => {
                  setError(null);
                  setEditando(u.id);
                }}
                onError={setError}
              />
            )
          )}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-muted-foreground">
                Aun no hay usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function esProtegido(u: UsuarioFila, miId: string, adminEmail: string) {
  const esYo = u.id === miId;
  const esPrincipal = !!adminEmail && (u.email ?? "").toLowerCase() === adminEmail.toLowerCase();
  return { esYo, esPrincipal };
}

function FilaLectura({
  usuario: u,
  miId,
  adminEmail,
  onEditar,
  onError,
}: {
  usuario: UsuarioFila;
  miId: string;
  adminEmail: string;
  onEditar: () => void;
  onError: (m: string | null) => void;
}) {
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);
  const { esYo, esPrincipal } = esProtegido(u, miId, adminEmail);
  const noEliminable = esYo || esPrincipal;

  async function eliminar() {
    if (!confirm(`Eliminar a ${u.name ?? u.email}? Se borrara tambien su progreso. Esta accion no se puede deshacer.`))
      return;
    setBorrando(true);
    onError(null);
    const r = await eliminarUsuario(u.id);
    setBorrando(false);
    if (r.ok) router.refresh();
    else onError(r.error ?? "No se pudo eliminar");
  }

  return (
    <tr className="border-t border-border">
      <td className="py-2 pr-3">{u.name ?? "-"}</td>
      <td className="py-2 pr-3">{u.email}</td>
      <td className="py-2 pr-3">
        <span className="inline-flex items-center gap-1">
          {u.rol === "ADMIN" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
          {u.rol === "ADMIN" ? "Admin" : "Usuario"}
        </span>
      </td>
      <td className="py-2 pr-3 text-muted-foreground">{u.tienePassword ? "definida" : "solo Google"}</td>
      <td className="py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onEditar}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={eliminar}
            disabled={noEliminable || borrando}
            title={noEliminable ? "No se puede eliminar esta cuenta" : "Eliminar"}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft/50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {borrando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function FilaEdicion({
  usuario: u,
  miId,
  adminEmail,
  onCancelar,
  onGuardado,
  onError,
}: {
  usuario: UsuarioFila;
  miId: string;
  adminEmail: string;
  onCancelar: () => void;
  onGuardado: () => void;
  onError: (m: string | null) => void;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(u.name ?? "");
  const [email, setEmail] = useState(u.email ?? "");
  const [rol, setRol] = useState<"ADMIN" | "ESTUDIANTE">(u.rol);
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const { esYo, esPrincipal } = esProtegido(u, miId, adminEmail);
  const rolBloqueado = esYo || esPrincipal; // no puede degradarse a si mismo ni al principal
  const correoBloqueado = esPrincipal;

  const clase =
    "h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function guardar() {
    setGuardando(true);
    onError(null);
    const r = await actualizarUsuario({ id: u.id, nombre, email, rol, password: password || undefined });
    setGuardando(false);
    if (r.ok) {
      onGuardado();
      router.refresh();
    } else {
      onError(r.error ?? "No se pudo actualizar");
    }
  }

  return (
    <tr className="border-t border-border bg-muted/30 align-top">
      <td className="py-2 pr-3">
        <input className={clase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
      </td>
      <td className="py-2 pr-3">
        <input
          className={clase}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={correoBloqueado}
          title={correoBloqueado ? "El correo del admin principal no se puede cambiar" : undefined}
        />
      </td>
      <td className="py-2 pr-3">
        <select
          className={clase}
          value={rol}
          onChange={(e) => setRol(e.target.value as "ADMIN" | "ESTUDIANTE")}
          disabled={rolBloqueado}
          title={rolBloqueado ? "No se puede cambiar el rol de esta cuenta" : undefined}
        >
          <option value="ESTUDIANTE">Usuario</option>
          <option value="ADMIN">Admin</option>
        </select>
      </td>
      <td className="py-2 pr-3">
        <input
          className={clase}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva (opcional)"
          minLength={8}
        />
      </td>
      <td className="py-2">
        <div className="flex items-center gap-1">
          <Boton tamano="sm" onClick={guardar} disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar
          </Boton>
          <Boton tamano="sm" variante="secundario" onClick={onCancelar} disabled={guardando}>
            <X className="h-4 w-4" /> Cancelar
          </Boton>
        </div>
      </td>
    </tr>
  );
}
