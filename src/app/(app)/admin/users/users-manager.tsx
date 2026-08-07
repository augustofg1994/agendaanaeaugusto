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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSecretary,
  resetPasswordAdmin,
  setSecretaryDoctorLink,
  setUserActive,
} from "@/server/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "SECRETARY";
  isAdmin: boolean;
  active: boolean;
  linkedDoctorId: string | null;
  linkedDoctorName: string | null;
};

type DoctorOption = { id: string; name: string; active: boolean };

export function UsersManager({
  users,
  doctorOptions,
  currentUserId,
}: {
  users: UserRow[];
  doctorOptions: DoctorOption[];
  currentUserId: string;
}) {
  const doctors = users.filter((u) => u.role === "DOCTOR");
  const secretaries = users.filter((u) => u.role === "SECRETARY");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Médicos</h2>
        <UsersTable
          rows={doctors}
          currentUserId={currentUserId}
          doctorOptions={doctorOptions}
          showDoctorLink={false}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Secretários</h2>
          <NewSecretaryDialog doctorOptions={doctorOptions} />
        </div>
        <UsersTable
          rows={secretaries}
          currentUserId={currentUserId}
          doctorOptions={doctorOptions}
          showDoctorLink
        />
      </section>
    </div>
  );
}

function UsersTable({
  rows,
  currentUserId,
  doctorOptions,
  showDoctorLink,
}: {
  rows: UserRow[];
  currentUserId: string;
  doctorOptions: DoctorOption[];
  showDoctorLink: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="py-3 pl-4">Nome</TableHead>
            <TableHead>E-mail</TableHead>
            {showDoctorLink && <TableHead>Médico vinculado</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => (
            <UserRowItem
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              doctorOptions={doctorOptions}
              showDoctorLink={showDoctorLink}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserRowItem({
  user,
  currentUserId,
  doctorOptions,
  showDoctorLink,
}: {
  user: UserRow;
  currentUserId: string;
  doctorOptions: DoctorOption[];
  showDoctorLink: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setUserActive(user.id, !user.active);
      if (!result.ok) toast.error(result.error);
      else toast.success(user.active ? "Usuário desativado." : "Usuário reativado.");
    });
  }

  function handleDoctorLinkChange(linkedDoctorId: string | null) {
    if (!linkedDoctorId) return;
    startTransition(async () => {
      const result = await setSecretaryDoctorLink({ userId: user.id, linkedDoctorId });
      if (!result.ok) toast.error(result.error);
      else toast.success("Vínculo atualizado.");
    });
  }

  return (
    <TableRow>
      <TableCell className="py-3 pl-4 font-medium">
        {user.name}
        {user.isAdmin && (
          <Badge variant="secondary" className="ml-2">
            Admin
          </Badge>
        )}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      {showDoctorLink && (
        <TableCell>
          <Select
            items={Object.fromEntries(doctorOptions.map((d) => [d.id, d.name]))}
            defaultValue={user.linkedDoctorId ?? undefined}
            onValueChange={handleDoctorLinkChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {doctorOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      <TableCell>
        <Badge variant={user.active ? "default" : "outline"}>
          {user.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="flex justify-end gap-2 pr-4">
        <ResetPasswordDialog userId={user.id} userName={user.name} />
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || user.id === currentUserId}
          onClick={handleToggleActive}
        >
          {user.active ? "Desativar" : "Reativar"}
        </Button>
      </TableCell>
    </TableRow>
  );
}

function NewSecretaryDialog({ doctorOptions }: { doctorOptions: DoctorOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      linkedDoctorId: formData.get("linkedDoctorId"),
    };

    startTransition(async () => {
      const result = await createSecretary(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Secretário criado.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Novo secretário</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo secretário</DialogTitle>
            <DialogDescription>
              O secretário só poderá gerenciar a agenda do médico vinculado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedDoctorId">Médico vinculado</Label>
              <Select
                name="linkedDoctorId"
                required
                items={Object.fromEntries(
                  doctorOptions.filter((d) => d.active).map((d) => [d.id, d.name])
                )}
              >
                <SelectTrigger id="linkedDoctorId" className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {doctorOptions
                    .filter((d) => d.active)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar secretário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");

    startTransition(async () => {
      const result = await resetPasswordAdmin({ userId, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Senha redefinida.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Redefinir senha
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redefinir senha de {userName}</DialogTitle>
            <DialogDescription>
              Informe uma nova senha temporária. Compartilhe com o usuário por um canal seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input id="new-password" name="password" type="password" minLength={8} required />
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
