import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const botonVariantes = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        primario:
          "bg-primary text-primary-foreground hover:brightness-95 active:brightness-90",
        secundario:
          "bg-card text-foreground border border-border hover:bg-muted",
        fantasma: "text-foreground hover:bg-muted",
        peligro:
          "bg-danger text-white hover:brightness-95 active:brightness-90",
        enlace: "text-primary underline-offset-4 hover:underline",
      },
      tamano: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icono: "h-10 w-10",
        bloque: "h-11 px-5 w-full",
      },
    },
    defaultVariants: {
      variante: "primario",
      tamano: "md",
    },
  }
);

export interface BotonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof botonVariantes> {}

export const Boton = React.forwardRef<HTMLButtonElement, BotonProps>(
  ({ className, variante, tamano, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(botonVariantes({ variante, tamano }), className)}
      {...props}
    />
  )
);
Boton.displayName = "Boton";

export { botonVariantes };
