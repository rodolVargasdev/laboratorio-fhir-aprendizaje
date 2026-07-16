import { cn } from "@/lib/utils";

/**
 * Marca de la plataforma. Icono SVG (Lucide-style, sin emojis) + palabra.
 * El nombre publico evita "DoctorSV"; usamos un rotulo neutro de aprendizaje.
 */
export function Marca({
  className,
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </span>
      {!compacta && (
        <span className="leading-tight">
          Ruta<span className="text-primary">FHIR</span>
        </span>
      )}
    </span>
  );
}
