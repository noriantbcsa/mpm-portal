import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Panel MPM</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ingresa con tu cuenta de administrador o ventas.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
