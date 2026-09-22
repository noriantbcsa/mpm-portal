import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EditUserForm } from "@/components/admin/user-forms";

export const metadata: Metadata = { title: "Editar usuario", robots: { index: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarUsuarioPage({ params }: PageProps) {
  const currentUser = await requireRole(["ADMIN"]);
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Editar usuario</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      <div className="mt-6">
        <EditUserForm
          user={{
            id: user.id,
            name: user.name,
            role: user.role,
            active: user.active,
            lockedUntil: user.lockedUntil,
          }}
          isSelf={user.id === currentUser.id}
        />
      </div>
    </div>
  );
}
