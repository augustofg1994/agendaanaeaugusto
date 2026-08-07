import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import { getDoctorScope } from "@/server/auth/scope";
import { listBlockedTimeForDoctor } from "@/server/queries/blocked-time";
import { BlockedTimeManager } from "./blocked-time-manager";

export default async function BlockedTimePage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { doctors, defaultDoctorId } = await getDoctorScope(session);
  if (doctors.length === 0) {
    return <p className="text-muted-foreground">Nenhum médico vinculado à sua conta.</p>;
  }

  const { doctorId: requestedDoctorId } = await searchParams;
  const selectedDoctor =
    doctors.find((d) => d.id === requestedDoctorId) ??
    doctors.find((d) => d.id === defaultDoctorId) ??
    doctors[0];

  const blockedTimes = await listBlockedTimeForDoctor(selectedDoctor.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bloqueios de horário</h1>
        <p className="text-muted-foreground">Férias, almoço e indisponibilidades.</p>
      </div>
      <BlockedTimeManager
        doctors={doctors}
        selectedDoctorId={selectedDoctor.id}
        canManage={selectedDoctor.access === "MANAGE"}
        blockedTimes={blockedTimes.map((b) => ({
          id: b.id,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          type: b.type,
          reason: b.reason,
        }))}
      />
    </div>
  );
}
