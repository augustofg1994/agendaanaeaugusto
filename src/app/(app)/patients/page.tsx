import Link from "next/link";
import { Plus, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchPatients } from "@/server/queries/patients";
import { formatCpf } from "@/lib/cpf";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const patients = await searchPatients(q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground">Cadastro e histórico de atendimentos.</p>
        </div>
        <Button
          className="shadow-sm"
          render={
            <Link href="/patients/new">
              <Plus className="size-4" />
              Novo paciente
            </Link>
          }
          nativeButton={false}
        />
      </div>

      <form className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Buscar por nome, CPF ou e-mail..."
          defaultValue={q}
          className="pl-9"
        />
      </form>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {patients.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-3 pl-4">Paciente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-3 pl-4">
                    <Link href={`/patients/${p.id}`} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {initials(p.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.fullName}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {formatCpf(p.cpf)}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.addressCity ? `${p.addressCity}${p.addressState ? "/" + p.addressState : ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="pr-4">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/patients/${p.id}/edit`} aria-label="Editar paciente" />}
                      nativeButton={false}
                    >
                      <SquarePen className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
