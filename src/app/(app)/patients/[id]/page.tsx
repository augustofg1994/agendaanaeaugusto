import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPatientWithHistory } from "@/server/queries/patients";
import { listRemindersForPatient } from "@/server/queries/reminders";
import { formatCpf } from "@/lib/cpf";
import { formatDateOnlyBR } from "@/lib/date-only";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";
import { AppointmentNotes } from "./appointment-notes";
import { DeleteAppointmentButton } from "./delete-appointment-button";
import { CreateReminderDialog } from "./create-reminder-dialog";
import { ReminderItem } from "../../reminders/reminder-item";

const statusLabel: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  PENDING_CONFIRMATION: "Retorno pendente",
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const patient = await getPatientWithHistory(id);
  if (!patient) notFound();

  const { doctors } = await getDoctorScope(session);
  const manageableDoctors = doctors.filter((d) => d.access === "MANAGE");
  const manageableDoctorIds = new Set(manageableDoctors.map((d) => d.id));

  const reminders = await listRemindersForPatient(patient.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{patient.fullName}</h1>
          <p className="text-muted-foreground">CPF: {formatCpf(patient.cpf)}</p>
        </div>
        <Button
          variant="outline"
          render={<Link href={`/patients/${patient.id}/edit`}>Editar</Link>}
          nativeButton={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">E-mail: </span>
            {patient.email}
          </div>
          <div>
            <span className="text-muted-foreground">Telefone: </span>
            {patient.phone}
          </div>
          <div>
            <span className="text-muted-foreground">Nascimento: </span>
            {formatDateOnlyBR(patient.dateOfBirth)}
          </div>
          {(patient.addressStreet || patient.addressCity) && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Endereço: </span>
              {[
                patient.addressStreet,
                patient.addressNumber,
                patient.addressComplement,
                patient.addressNeighborhood,
                patient.addressCity,
                patient.addressState,
                patient.addressZipCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Pendências</h2>
          <CreateReminderDialog patientId={patient.id} doctors={manageableDoctors} />
        </div>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência para este paciente.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <ReminderItem
                key={r.id}
                reminder={{
                  id: r.id,
                  doctorId: r.doctorId,
                  patientId: r.patientId,
                  patientName: patient.fullName,
                  message: r.message,
                  dueDate: r.dueDate.toISOString(),
                  status: r.status,
                  source: r.source,
                }}
                canManage={manageableDoctorIds.has(r.doctorId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Histórico de consultas</h2>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
        ) : (
          <div className="space-y-3">
            {patient.appointments.map((appt) => (
              <Card key={appt.id}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {format(appt.startTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} —{" "}
                      {appt.procedureType.name}
                    </div>
                    <Badge variant="outline">{statusLabel[appt.status] ?? appt.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Médico: {appt.doctor.name}</p>
                  <AppointmentNotes appointmentId={appt.id} initialNotes={appt.notes ?? ""} />
                  {manageableDoctorIds.has(appt.doctorId) && (
                    <div className="flex justify-end border-t pt-2">
                      <DeleteAppointmentButton appointmentId={appt.id} patientName={patient.fullName} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
