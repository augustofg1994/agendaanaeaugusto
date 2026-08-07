"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateParam } from "@/lib/agenda-range";
import { confirmPendingAppointment } from "@/server/actions/appointments";

type FollowUpItem = {
  id: string;
  startTime: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  procedureName: string;
  canManage: boolean;
};

export function FollowUpsList({
  items,
  emptyMessage,
}: {
  items: FollowUpItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <FollowUpRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function FollowUpRow({ item }: { item: FollowUpItem }) {
  const [isPending, startTransition] = useTransition();
  const date = new Date(item.startTime);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmPendingAppointment(item.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Retorno confirmado.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="font-medium">{item.patientName}</p>
          <p className="text-sm text-muted-foreground">
            {item.procedureName} · {item.doctorName} ·{" "}
            {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        {item.canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/agenda/${item.doctorId}?view=day&date=${formatDateParam(date)}`}>
                  Ver na agenda
                </Link>
              }
              nativeButton={false}
            />
            <Button size="sm" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
