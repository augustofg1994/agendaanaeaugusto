"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  Users,
  Stethoscope,
  Lock,
  History,
  UserCog,
  Activity,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";

const links = [
  { href: "/agenda", label: "Agenda", icon: CalendarCheck2 },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/procedures", label: "Procedimentos", icon: Stethoscope },
  { href: "/blocked-time", label: "Bloqueios", icon: Lock },
  { href: "/reminders", label: "Pendências", icon: ListChecks },
  { href: "/follow-ups", label: "Retornos", icon: History },
];

export function SidebarNav({ user }: { user: Session["user"] }) {
  const pathname = usePathname();
  const items = user.isAdmin
    ? [...links, { href: "/admin/users", label: "Usuários", icon: UserCog }]
    : links;

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-4">
      <Link
        href="/agenda"
        className="mb-4 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
      >
        <Activity className="size-5" />
      </Link>
      <nav className="flex flex-col items-center gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex size-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-[1.15rem]" strokeWidth={active ? 2.4 : 2} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
