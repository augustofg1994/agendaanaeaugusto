import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";
import { getPendingFollowUps } from "@/server/queries/followUps";
import { FollowUpsList } from "./follow-ups-list";

export default async function FollowUpsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { doctors } = await getDoctorScope(session);
  const { overdue, upcoming } = await getPendingFollowUps(doctors.map((d) => d.id));

  const doctorAccess = Object.fromEntries(doctors.map((d) => [d.id, d.access]));
  const serialize = (rows: typeof overdue) =>
    rows.map((r) => ({
      id: r.id,
      startTime: r.startTime.toISOString(),
      patientName: r.patient.fullName,
      doctorId: r.doctorId,
      doctorName: r.doctor.name,
      procedureName: r.procedureType.name,
      canManage: doctorAccess[r.doctorId] === "MANAGE",
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Retornos pendentes</h1>
        <p className="text-muted-foreground">
          Sugestões automáticas de retorno aguardando confirmação.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-destructive">
          Atrasados {overdue.length > 0 && `(${overdue.length})`}
        </h2>
        <FollowUpsList items={serialize(overdue)} emptyMessage="Nenhum retorno atrasado." />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          Próximos {upcoming.length > 0 && `(${upcoming.length})`}
        </h2>
        <FollowUpsList items={serialize(upcoming)} emptyMessage="Nenhum retorno pendente." />
      </section>
    </div>
  );
}
