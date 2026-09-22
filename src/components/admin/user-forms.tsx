"use client";

import { useActionState } from "react";

import { createUserAction, updateUserAction, type UserFormState } from "@/app/admin/usuarios/actions";
import { ROLE_LABELS } from "@/lib/constants";
import { AdminButton, AdminCheckbox, AdminSelectField, AdminTextField } from "@/components/admin/ui/controls";

const initialState: UserFormState = { status: "idle" };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AdminTextField label="Nombre" name="name" required />
      <AdminTextField label="Correo" name="email" type="email" required />
      <AdminSelectField label="Rol" name="role" defaultValue="SALES">
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </AdminSelectField>
      <AdminTextField
        label="Contraseña temporal"
        name="password"
        type="text"
        required
        hint="Compártela por un canal seguro; el usuario podrá cambiarla luego."
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}
      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear usuario"}
        </AdminButton>
      </div>
    </form>
  );
}

export function EditUserForm({
  user,
  isSelf,
}: {
  user: { id: string; name: string; role: "ADMIN" | "SALES"; active: boolean };
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateUserAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={user.id} />
      <AdminTextField label="Nombre" name="name" defaultValue={user.name} required />
      <AdminSelectField label="Rol" name="role" defaultValue={user.role} disabled={isSelf}>
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </AdminSelectField>
      <AdminCheckbox label="Cuenta activa" name="active" defaultChecked={user.active} disabled={isSelf} />
      <AdminTextField
        label="Nueva contraseña (opcional)"
        name="password"
        type="text"
        hint="Déjalo en blanco para no cambiarla."
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}
      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </AdminButton>
      </div>
    </form>
  );
}
