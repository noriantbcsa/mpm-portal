"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Megaphone,
  ClipboardList,
  Timer,
  Users,
  Settings,
  Palette,
} from "lucide-react";

import { cx } from "@/components/admin/ui/controls";
import type { Role } from "@prisma/client";

const NAV_GROUPS = [
  {
    label: "Atención comercial",
    items: [
      { href: "/admin", label: "Resumen", icon: LayoutDashboard, roles: ["ADMIN", "SALES"] as Role[] },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: ClipboardList, roles: ["ADMIN", "SALES"] as Role[] },
      { href: "/admin/carritos-abandonados", label: "Carritos", icon: Timer, roles: ["ADMIN", "SALES"] as Role[] },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package, roles: ["ADMIN"] as Role[] },
      { href: "/admin/categorias", label: "Categorías", icon: FolderTree, roles: ["ADMIN"] as Role[] },
      { href: "/admin/campanas", label: "Campañas", icon: Megaphone, roles: ["ADMIN"] as Role[] },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/admin/usuarios", label: "Equipo", icon: Users, roles: ["ADMIN"] as Role[] },
      { href: "/admin/festividades", label: "Diseño festivo", icon: Palette, roles: ["ADMIN"] as Role[] },
      { href: "/admin/ajustes", label: "Ajustes del sitio", icon: Settings, roles: ["ADMIN"] as Role[] },
    ],
  },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación del panel"
      className="flex gap-1 overflow-x-auto p-3 md:flex-col md:gap-4 md:overflow-visible"
    >
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="flex shrink-0 gap-1 md:flex-col">
            <p className="hidden px-3 pb-1 text-xs font-medium text-slate-400 md:block">{group.label}</p>
            {items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "admin-nav-active bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
