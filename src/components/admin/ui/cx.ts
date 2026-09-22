import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Vive en su propio módulo (sin "use client") para que los Server Components
 * como AdminCard puedan importarlo: cualquier export de un archivo marcado
 * "use client" se convierte en una referencia de cliente, y no puede
 * invocarse directamente desde el servidor.
 */
export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
