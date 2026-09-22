"use client";

import { useActionState } from "react";

import { loginAction, type LoginFormState } from "@/lib/auth/actions";
import { AdminButton, AdminTextField } from "@/components/admin/ui/controls";

const initialState: LoginFormState = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AdminTextField label="Correo" name="email" type="email" autoComplete="username" required />
      <AdminTextField label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      <AdminButton type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </AdminButton>
    </form>
  );
}
