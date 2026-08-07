"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBlockedTime } from "@/server/actions/blocked-time";

export const blockedTimeTypeLabel: Record<string, string> = {
  VACATION: "Férias",
  LUNCH: "Almoço",
  UNAVAILABLE: "Indisponível",
  OTHER: "Outro",
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function NewBlockedTimeDialog({
  doctorId,
  defaultDate,
  defaultRange,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: {
  doctorId: string;
  /** Data sugerida ao abrir com "dia todo" marcado (ex: dia atualmente visível na agenda). */
  defaultDate?: Date;
  /** Intervalo exato sugerido (ex: seleção por arraste na agenda) — abre com "dia todo" desmarcado. */
  defaultRange?: { start: Date; end: Date };
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("UNAVAILABLE");
  const [fullDay, setFullDay] = useState(Boolean(defaultDate) && !defaultRange);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = fullDay
      ? {
          doctorId,
          startTime: `${formData.get("fullDayDate")}T08:00`,
          endTime: `${formData.get("fullDayDate")}T20:00`,
          type,
          reason: formData.get("reason"),
        }
      : {
          doctorId,
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          type,
          reason: formData.get("reason"),
        };

    startTransition(async () => {
      const result = await createBlockedTime(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Bloqueio criado.");
      setOpen(false);
      onCreated?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger render={trigger} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger render={<Button size="sm">Novo bloqueio</Button>} />
      ) : null}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo bloqueio de horário</DialogTitle>
            <DialogDescription>
              Consultas não poderão ser marcadas dentro deste intervalo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                items={blockedTimeTypeLabel}
                value={type}
                onValueChange={(v) => v && setType(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(blockedTimeTypeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fullDay}
                onChange={(e) => setFullDay(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Bloquear o dia todo (08:00 às 20:00)
            </label>

            {fullDay ? (
              <div className="space-y-2">
                <Label htmlFor="fullDayDate">Dia</Label>
                <Input
                  id="fullDayDate"
                  name="fullDayDate"
                  type="date"
                  defaultValue={defaultDate ? toDateInputValue(defaultDate) : undefined}
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Início</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    defaultValue={defaultRange ? toDateTimeInputValue(defaultRange.start) : undefined}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Fim</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    defaultValue={defaultRange ? toDateTimeInputValue(defaultRange.end) : undefined}
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input id="reason" name="reason" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Criar bloqueio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
