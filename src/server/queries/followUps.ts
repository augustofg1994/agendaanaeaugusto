import { prisma } from "@/server/db/prisma";

export async function getPendingFollowUps(doctorIds: string[]) {
  if (doctorIds.length === 0) return { overdue: [], upcoming: [] };

  const rows = await prisma.appointment.findMany({
    where: { status: "PENDING_CONFIRMATION", doctorId: { in: doctorIds } },
    include: { patient: true, procedureType: true, doctor: true },
    orderBy: { startTime: "asc" },
  });

  const now = new Date();
  return {
    overdue: rows.filter((r) => r.startTime < now),
    upcoming: rows.filter((r) => r.startTime >= now),
  };
}
