"use client";

import { useState, useTransition } from "react";
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
import { createAppointment } from "@/server/actions/appointments";
import type { PatientOption, ProcedureOption } from "./types";

function toDateTimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function AppointmentFormDialog({
  doctorId,
  patients,
  procedureTypes,
  trigger,
  defaultStartTime,
  open: controlledOpen,
  onOpenChange,
}: {
  doctorId: string;
  patients: PatientOption[];
  procedureTypes: ProcedureOption[];
  trigger?: React.ReactNode;
  defaultStartTime?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [procedureTypeId, setProcedureTypeId] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      doctorId,
      patientId,
      procedureTypeId,
      startTime: formData.get("startTime"),
      notes: formData.get("notes"),
    };

    startTransition(async () => {
      const result = await createAppointment(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Consulta agendada.");
      setOpen(false);
      setPatientId("");
      setProcedureTypeId("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova consulta</DialogTitle>
            <DialogDescription>
              A duração é definida automaticamente pelo procedimento escolhido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select
                items={Object.fromEntries(patients.map((p) => [p.id, p.fullName]))}
                value={patientId}
                onValueChange={(v) => v && setPatientId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select
                items={Object.fromEntries(
                  procedureTypes.map((p) => [p.id, `${p.name} (${p.defaultDurationMinutes} min)`])
                )}
                value={procedureTypeId}
                onValueChange={(v) => v && setProcedureTypeId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o procedimento..." />
                </SelectTrigger>
                <SelectContent>
                  {procedureTypes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.defaultDurationMinutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Data e horário</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                defaultValue={defaultStartTime ? toDateTimeLocalValue(defaultStartTime) : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input id="notes" name="notes" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !patientId || !procedureTypeId}>
              {isPending ? "Agendando..." : "Agendar consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
