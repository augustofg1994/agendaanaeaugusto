import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";
import { listRemindersForDay, listRemindersInRange } from "@/server/queries/reminders";
import { getAgendaRange, parseDateParam, type AgendaView } from "@/lib/agenda-range";
import { RemindersBoard } from "./reminders-board";

function serialize(rows: Awaited<ReturnType<typeof listRemindersInRange>>) {
  return rows.map((r) => ({
    id: r.id,
    doctorId: r.doctorId,
    patientId: r.patientId,
    patientName: r.patient.fullName,
    message: r.message,
    dueDate: r.dueDate.toISOString(),
    status: r.status,
    source: r.source,
  }));
}

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; view?: string; date?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { doctors, defaultDoctorId } = await getDoctorScope(session);
  if (doctors.length === 0) {
    return <p className="text-muted-foreground">Nenhum médico vinculado à sua conta.</p>;
  }

  const { doctorId: requestedDoctorId, view: rawView, date: rawDate } = await searchParams;
  const selectedDoctor =
    doctors.find((d) => d.id === requestedDoctorId) ??
    doctors.find((d) => d.id === defaultDoctorId) ??
    doctors[0];

  const view: AgendaView = rawView === "month" ? "month" : "day";
  const date = parseDateParam(rawDate);
  const canManage = selectedDoctor.access === "MANAGE";

  if (view === "month") {
    const { from, to } = getAgendaRange("month", date);
    const reminders = await listRemindersInRange([selectedDoctor.id], from, to);
    return (
      <RemindersBoard
        doctors={doctors}
        selectedDoctorId={selectedDoctor.id}
        canManage={canManage}
        view={view}
        date={date.toISOString()}
        monthReminders={serialize(reminders)}
      />
    );
  }

  const { overdue, dueToday } = await listRemindersForDay([selectedDoctor.id], date);
  return (
    <RemindersBoard
      doctors={doctors}
      selectedDoctorId={selectedDoctor.id}
      canManage={canManage}
      view={view}
      date={date.toISOString()}
      dayOverdue={serialize(overdue)}
      dayDueToday={serialize(dueToday)}
    />
  );
}
