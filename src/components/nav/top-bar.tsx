"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";

export function TopBar({ user }: { user: Session["user"] }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <span className="text-sm font-semibold text-foreground">Agenda da Clínica</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {user.name}{" "}
          <span className="text-xs">({user.role === "DOCTOR" ? "Médico" : "Secretário"})</span>
        </span>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sair
        </Button>
      </div>
    </header>
  );
}
