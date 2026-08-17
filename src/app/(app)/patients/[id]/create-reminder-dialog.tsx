"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createReminder } from "@/server/actions/reminders";

type DoctorOption = { id: string; name: string };

export function CreateReminderDialog({
  patientId,
  doctors,
}: {
  patientId: string;
  doctors: DoctorOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");

  if (doctors.length === 0) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    setIsPending(true);

    createReminder({
      doctorId,
      patientId,
      message: formData.get("message"),
      dueDate: formData.get("dueDate"),
    }).then((result) => {
      setIsPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Tarefa criada.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Criar tarefa</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              Aparece na aba Pendências no dia escolhido, até ser marcada como resolvida.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {doctors.length > 1 && (
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select
                  items={Object.fromEntries(doctors.map((d) => [d.id, d.name]))}
                  value={doctorId}
                  onValueChange={(v) => v && setDoctorId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">O que precisa ser feito?</Label>
              <Textarea id="message" name="message" required placeholder="Ex: Ligar para confirmar exame de rotina" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Aparecer nas Pendências em</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
