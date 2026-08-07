import { prisma } from "@/server/db/prisma";

export async function getAgendaForRange(doctorId: string, from: Date, to: Date) {
  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ["SCHEDULED", "COMPLETED", "PENDING_CONFIRMATION"] },
        startTime: { lt: to },
        endTime: { gt: from },
      },
      include: { patient: true, procedureType: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedTime.findMany({
      where: { doctorId, startTime: { lt: to }, endTime: { gt: from } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return { appointments, blockedTimes };
}
