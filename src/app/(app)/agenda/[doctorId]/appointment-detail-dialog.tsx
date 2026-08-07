"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  completeAppointment,
  confirmPendingAppointment,
  deleteAppointment,
  rescheduleAppointment,
} from "@/server/actions/appointments";
import type { AppointmentItem } from "./types";

const statusLabel: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  PENDING_CONFIRMATION: "Retorno pendente",
};

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function AppointmentDetailDialog({
  appointment,
  canManage,
  open,
  onOpenChange,
}: {
  appointment: AppointmentItem;
  canManage: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel" | "delete">("view");

  const isActionable = appointment.status === "SCHEDULED" || appointment.status === "PENDING_CONFIRMATION";

  function handleReschedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await rescheduleAppointment(appointment.id, { startTime: formData.get("startTime") });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Consulta remarcada.");
      onOpenChange(false);
    });
  }

  function handleCancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id, { reason: formData.get("reason") });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Consulta cancelada.");
      onOpenChange(false);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeAppointment(appointment.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Consulta concluída.");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAppointment(appointment.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Consulta excluída.");
      onOpenChange(false);
    });
  }

  function handleConfirmPending() {
    startTransition(async () => {
      const result = await confirmPendingAppointment(appointment.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Retorno confirmado.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setMode("view");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{appointment.patientName}</DialogTitle>
          <DialogDescription>{appointment.procedureName}</DialogDescription>
        </DialogHeader>

        {mode === "view" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusLabel[appointment.status] ?? appointment.status}</Badge>
              <span className="text-sm">
                {format(new Date(appointment.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })} –{" "}
                {format(new Date(appointment.endTime), "HH:mm", { locale: ptBR })}
              </span>
            </div>
            {appointment.notes && <p className="text-sm text-muted-foreground">{appointment.notes}</p>}
            {canManage && isActionable && (
              <DialogFooter className="!mx-0 !mb-0 !mt-2 !rounded-none !border-0 !bg-transparent !p-0">
                <Button variant="outline" size="sm" onClick={() => setMode("reschedule")}>
                  Remarcar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMode("cancel")}>
                  Cancelar consulta
                </Button>
                {appointment.status === "SCHEDULED" && (
                  <Button size="sm" onClick={handleComplete} disabled={isPending}>
                    {isPending ? "Salvando..." : "Concluir"}
                  </Button>
                )}
                {appointment.status === "PENDING_CONFIRMATION" && (
                  <Button size="sm" onClick={handleConfirmPending} disabled={isPending}>
                    {isPending ? "Salvando..." : "Confirmar retorno"}
                  </Button>
                )}
              </DialogFooter>
            )}
            {canManage && (
              <div className="flex justify-end border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setMode("delete")}
                >
                  Excluir atendimento
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === "reschedule" && (
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Novo horário</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocalValue(new Date(appointment.startTime))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                Voltar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Confirmar remarcação"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === "cancel" && (
          <form onSubmit={handleCancel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
              <Input id="reason" name="reason" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === "delete" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Isso remove o atendimento de <strong>{appointment.patientName}</strong>{" "}
              permanentemente, incluindo do histórico do paciente. Essa ação não pode ser desfeita.
              Se você só quer marcar como não realizado, prefira &ldquo;Cancelar consulta&rdquo;.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMode("view")}>
                Voltar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Excluindo..." : "Excluir permanentemente"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
