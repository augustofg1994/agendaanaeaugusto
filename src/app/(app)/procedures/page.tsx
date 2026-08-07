import { getAuthSession } from "@/server/auth/session";
import { listProcedureTypes } from "@/server/queries/procedures";
import { listDoctors } from "@/server/queries/users";
import { ProceduresManager } from "./procedures-manager";

export default async function ProceduresPage() {
  const session = await getAuthSession();
  const [procedures, doctors] = await Promise.all([
    listProcedureTypes(),
    listDoctors({ onlyActive: true }),
  ]);

  const serialized = procedures.map((p) => ({
    id: p.id,
    name: p.name,
    defaultDurationMinutes: p.defaultDurationMinutes,
    followUpDays: p.followUpDays,
    active: p.active,
    doctorIds: p.doctors.map((d) => d.doctorId),
    doctorNames: p.doctors.map((d) => d.doctor.name),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Procedimentos</h1>
        <p className="text-muted-foreground">
          Duração padrão e regra de retorno automático por procedimento.
        </p>
      </div>
      <ProceduresManager
        procedures={serialized}
        doctorOptions={doctors.map((d) => ({ id: d.id, name: d.name }))}
        isAdmin={!!session?.user.isAdmin}
      />
    </div>
  );
}
