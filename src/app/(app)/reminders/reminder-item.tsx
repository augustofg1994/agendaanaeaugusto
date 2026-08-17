"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { setReminderStatus } from "@/server/actions/reminders";

export type ReminderRow = {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  message: string;
  dueDate: string;
  status: "PENDING" | "RESOLVED";
  source: "MANUAL" | "AUTO_CONFIRMATION";
};

export function ReminderItem({ reminder, canManage }: { reminder: ReminderRow; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const resolved = reminder.status === "RESOLVED";

  function handleToggle() {
    startTransition(async () => {
      const result = await setReminderStatus(reminder.id, resolved ? "PENDING" : "RESOLVED");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(resolved ? "Pendência reaberta." : "Pendência resolvida.");
    });
  }

  return (
    <Card className={resolved ? "opacity-60" : undefined}>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/patients/${reminder.patientId}`} className="font-medium hover:underline">
              {reminder.patientName}
            </Link>
            <Badge variant="outline" className="text-[0.7rem]">
              {reminder.source === "AUTO_CONFIRMATION" ? "Automático" : "Manual"}
            </Badge>
          </div>
          <p className={resolved ? "text-sm text-muted-foreground line-through" : "text-sm"}>
            {reminder.message}
          </p>
          <p className="text-xs text-muted-foreground">
            Vence em {format(new Date(reminder.dueDate), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        {canManage && (
          <Button
            variant={resolved ? "outline" : "default"}
            size="sm"
            disabled={isPending}
            onClick={handleToggle}
          >
            {isPending ? "Salvando..." : resolved ? "Reabrir" : "Marcar como resolvido"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
