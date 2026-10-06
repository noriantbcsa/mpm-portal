"use client";

import { useActionState } from "react";

import {
  changeOwnPasswordAction,
  updateProfileNameAction,
  type ProfileFormState,
} from "@/app/admin/perfil/actions";
import { AdminButton, AdminTextField } from "@/components/admin/ui/controls";

const initialState: ProfileFormState = { status: "idle" };

function Feedback({ state }: { state: ProfileFormState }) {
  if (state.status === "success") {
    return (
      <p role="status" className="text-sm font-medium text-green-700">
        {state.message}
      </p>
    );
  }
  if (state.status === "error" && !state.fieldErrors) {
    return (
      <p role="alert" className="text-sm font-medium text-red-600">
        {state.message}
      </p>
    );
  }
  return null;
}

export function ProfileNameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateProfileNameAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AdminTextField label="Nombre" name="name" defaultValue={defaultName} required autoComplete="name" />
      <Feedback state={state} />
      <div>
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar nombre"}
        </AdminButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AdminTextField
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
        error={errors?.currentPassword}
      />
      <AdminTextField
        label="Contraseña nueva"
        name="newPassword"
        type="password"
        required
        autoComplete="new-password"
        hint="Entre 8 y 72 caracteres."
        error={errors?.newPassword}
      />
      <AdminTextField
        label="Repite la contraseña nueva"
        name="confirmPassword"
        type="password"
        required
        autoComplete="new-password"
        error={errors?.confirmPassword}
      />
      <Feedback state={state} />
      <div>
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Cambiando…" : "Cambiar contraseña"}
        </AdminButton>
      </div>
    </form>
  );
}
