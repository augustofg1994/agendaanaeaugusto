"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateAppointmentNotes } from "@/server/actions/patients";

export function AppointmentNotes({
  appointmentId,
  initialNotes,
}: {
  appointmentId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const dirty = notes !== initialNotes;

  function handleSave() {
    startTransition(async () => {
      const result = await updateAppointmentNotes(appointmentId, notes);
      if (!result.ok) toast.error(result.error);
      else toast.success("Observações salvas.");
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações/anotações clínicas desta consulta..."
        rows={2}
      />
      {dirty && (
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar observações"}
        </Button>
      )}
    </div>
  );
}
