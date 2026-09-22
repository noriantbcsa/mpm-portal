export default function LoadingAdmin() {
  return (
    <div role="status" className="flex items-center gap-2 py-10 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      Cargando…
    </div>
  );
}
