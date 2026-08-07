import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";
import { getAgendaForRange } from "@/server/queries/agenda";
import { listProcedureTypesForDoctor } from "@/server/queries/procedures";
import { searchPatients } from "@/server/queries/patients";
import { getAgendaRange, parseDateParam, type AgendaView } from "@/lib/agenda-range";
import { AgendaBoard } from "./agenda-board";

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ doctorId: string }>;
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { doctorId } = await params;
  const { doctors } = await getDoctorScope(session);
  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) redirect("/agenda");

  const { view: rawView, date: rawDate } = await searchParams;
  const view: AgendaView = rawView === "day" || rawView === "month" ? rawView : "week";
  const date = parseDateParam(rawDate);

  const { from, to } = getAgendaRange(view, date);
  const [{ appointments, blockedTimes }, procedureTypes, patients] = await Promise.all([
    getAgendaForRange(doctorId, from, to),
    listProcedureTypesForDoctor(doctorId),
    doctor.access === "MANAGE" ? searchPatients("") : Promise.resolve([]),
  ]);

  return (
    <AgendaBoard
      doctors={doctors}
      selectedDoctorId={doctorId}
      canManage={doctor.access === "MANAGE"}
      view={view}
      date={date.toISOString()}
      appointments={appointments.map((a) => ({
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        status: a.status,
        notes: a.notes,
        patientName: a.patient.fullName,
        procedureName: a.procedureType.name,
      }))}
      blockedTimes={blockedTimes.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        type: b.type,
        reason: b.reason,
      }))}
      procedureTypes={procedureTypes.map((p) => ({
        id: p.id,
        name: p.name,
        defaultDurationMinutes: p.defaultDurationMinutes,
      }))}
      patients={patients.map((p) => ({ id: p.id, fullName: p.fullName }))}
    />
  );
}
