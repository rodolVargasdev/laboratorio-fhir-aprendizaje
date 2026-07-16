import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases condicionales y resuelve conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
