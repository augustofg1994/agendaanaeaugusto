"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  createProcedureType,
  setProcedureTypeActive,
  updateProcedureType,
} from "@/server/actions/procedures";

type ProcedureRow = {
  id: string;
  name: string;
  defaultDurationMinutes: number;
  followUpDays: number | null;
  active: boolean;
  doctorIds: string[];
  doctorNames: string[];
};

type DoctorOption = { id: string; name: string };

export function ProceduresManager({
  procedures,
  doctorOptions,
  isAdmin,
}: {
  procedures: ProcedureRow[];
  doctorOptions: DoctorOption[];
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <ProcedureDialog mode="create" doctorOptions={doctorOptions} />
        </div>
      )}

      {procedures.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum procedimento cadastrado.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-3 pl-4">Nome</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead>Médicos</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="pr-4 text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((p) => (
                <ProcedureRowItem key={p.id} procedure={p} doctorOptions={doctorOptions} isAdmin={isAdmin} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ProcedureRowItem({
  procedure,
  doctorOptions,
  isAdmin,
}: {
  procedure: ProcedureRow;
  doctorOptions: DoctorOption[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setProcedureTypeActive(procedure.id, !procedure.active);
      if (!result.ok) toast.error(result.error);
      else toast.success(procedure.active ? "Procedimento desativado." : "Procedimento reativado.");
    });
  }

  return (
    <TableRow>
      <TableCell className="py-3 pl-4 font-medium">{procedure.name}</TableCell>
      <TableCell>{procedure.defaultDurationMinutes} min</TableCell>
      <TableCell>{procedure.followUpDays ? `${procedure.followUpDays} dias` : "—"}</TableCell>
      <TableCell>{procedure.doctorNames.join(", ")}</TableCell>
      <TableCell>
        <Badge variant={procedure.active ? "default" : "outline"}>
          {procedure.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      {isAdmin && (
        <TableCell className="flex justify-end gap-2 pr-4">
          <ProcedureDialog mode="edit" procedure={procedure} doctorOptions={doctorOptions} />
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggleActive}>
            {procedure.active ? "Desativar" : "Reativar"}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

function ProcedureDialog({
  mode,
  procedure,
  doctorOptions,
}: {
  mode: "create" | "edit";
  procedure?: ProcedureRow;
  doctorOptions: DoctorOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>(procedure?.doctorIds ?? []);

  function toggleDoctor(id: string) {
    setSelectedDoctors((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      defaultDurationMinutes: formData.get("defaultDurationMinutes"),
      followUpDays: formData.get("followUpDays"),
      doctorIds: selectedDoctors,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProcedureType(payload)
          : await updateProcedureType(procedure!.id, payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(mode === "create" ? "Procedimento criado." : "Procedimento atualizado.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant={mode === "create" ? "default" : "outline"}>
            {mode === "create" ? "Novo procedimento" : "Editar"}
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Novo procedimento" : "Editar procedimento"}</DialogTitle>
            <DialogDescription>
              A duração define o slot na agenda. O retorno automático (opcional) sugere um
              agendamento pendente de confirmação N dias após a consulta ser concluída.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={procedure?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDurationMinutes">Duração (min)</Label>
                <Input
                  id="defaultDurationMinutes"
                  name="defaultDurationMinutes"
                  type="number"
                  min={5}
                  max={480}
                  defaultValue={procedure?.defaultDurationMinutes ?? 30}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDays">Retorno em (dias, opcional)</Label>
                <Input
                  id="followUpDays"
                  name="followUpDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={procedure?.followUpDays ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Médicos que realizam este procedimento</Label>
              <div className="space-y-1">
                {doctorOptions.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(d.id)}
                      onChange={() => toggleDoctor(d.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
