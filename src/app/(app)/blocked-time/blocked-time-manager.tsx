"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteBlockedTime } from "@/server/actions/blocked-time";
import {
  NewBlockedTimeDialog,
  blockedTimeTypeLabel as typeLabel,
} from "@/components/blocked-time/new-blocked-time-dialog";

type BlockedTime = {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  reason: string | null;
};

type DoctorOption = { id: string; name: string; access: "MANAGE" | "VIEW" };

export function BlockedTimeManager({
  doctors,
  selectedDoctorId,
  canManage,
  blockedTimes,
}: {
  doctors: DoctorOption[];
  selectedDoctorId: string;
  canManage: boolean;
  blockedTimes: BlockedTime[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {doctors.length > 1 ? (
          <Select
            items={Object.fromEntries(doctors.map((d) => [d.id, d.name]))}
            value={selectedDoctorId}
            onValueChange={(v) => v && router.push(`/blocked-time?doctorId=${v}`)}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} {d.access === "VIEW" ? "(somente leitura)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">{doctors[0]?.name}</span>
        )}
        {canManage && <NewBlockedTimeDialog doctorId={selectedDoctorId} />}
      </div>

      {blockedTimes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum bloqueio futuro cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {blockedTimes.map((b) => (
            <BlockedTimeRow key={b.id} blockedTime={b} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockedTimeRow({ blockedTime, canManage }: { blockedTime: BlockedTime; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBlockedTime(blockedTime.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Bloqueio removido.");
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{typeLabel[blockedTime.type] ?? blockedTime.type}</Badge>
            <span className="text-sm font-medium">
              {format(new Date(blockedTime.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })} —{" "}
              {format(new Date(blockedTime.endTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
          </div>
          {blockedTime.reason && <p className="text-sm text-muted-foreground">{blockedTime.reason}</p>}
        </div>
        {canManage && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleDelete}>
            Remover
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
