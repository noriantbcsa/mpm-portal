import { AdminLinkButton } from "@/components/admin/ui/controls";
import { AdminEmptyState } from "@/components/admin/ui/display";

export default function AdminNotFound() {
  return (
    <div className="max-w-lg">
      <AdminEmptyState
        title="No encontramos este registro"
        description="Puede que ya se haya eliminado o que el enlace esté desactualizado."
        action={<AdminLinkButton href="/admin">Volver al panel</AdminLinkButton>}
      />
    </div>
  );
}
