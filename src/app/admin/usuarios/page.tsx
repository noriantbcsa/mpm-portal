import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/constants";
import { AdminBadge, AdminCard, AdminCardBody, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";
import { CreateUserForm } from "@/components/admin/user-forms";

export const metadata: Metadata = { title: "Usuarios", robots: { index: false } };

type PageProps = { searchParams: Promise<{ creado?: string; guardado?: string }> };

export default async function UsuariosPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">Cuentas con acceso al panel administrativo.</p>

        {(sp.creado || sp.guardado) && (
          <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            {sp.creado ? "Usuario creado." : "Cambios guardados."}
          </p>
        )}

        <div className="mt-4">
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Nombre</AdminTh>
                <AdminTh>Correo</AdminTh>
                <AdminTh>Rol</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh>
                  <span className="sr-only">Acciones</span>
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <AdminTd className="font-medium text-slate-900">
                    <a href={`/admin/usuarios/${user.id}`} className="hover:text-blue-700 hover:underline">
                      {user.name}
                    </a>
                  </AdminTd>
                  <AdminTd>{user.email}</AdminTd>
                  <AdminTd>{ROLE_LABELS[user.role]}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={user.active ? "green" : "neutral"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </AdminBadge>
                    {user.lockedUntil && user.lockedUntil > new Date() && (
                      <AdminBadge tone="red" className="ml-1">
                        Bloqueada
                      </AdminBadge>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <a href={`/admin/usuarios/${user.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                      Editar
                    </a>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      </div>

      <AdminCard className="h-fit">
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">Nuevo usuario</h2>
          <div className="mt-4">
            <CreateUserForm />
          </div>
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
