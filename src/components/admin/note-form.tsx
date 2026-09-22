"use client";

import { useActionState, useRef } from "react";

import { addNoteAction, type ActionResult } from "@/app/admin/solicitudes/actions";
import { AdminButton } from "@/components/admin/ui/controls";

const initialState: ActionResult = { status: "idle" };

export function NoteForm({ cartRequestId }: { cartRequestId: string }) {
  const [state, formAction, pending] = useActionState(addNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="cartRequestId" value={cartRequestId} />
      <label htmlFor="note" className="text-sm font-medium text-slate-700">
        Agregar nota interna
      </label>
      <textarea
        id="note"
        name="note"
        rows={2}
        required
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="Ej: cliente confirmó por llamada, pendiente enviar cotización…"
      />
      {state.status === "error" && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.message}
        </p>
      )}
      <div>
        <AdminButton type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando…" : "Agregar nota"}
        </AdminButton>
      </div>
    </form>
  );
}
