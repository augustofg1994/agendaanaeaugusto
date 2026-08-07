import { prisma } from "@/server/db/prisma";

export function searchPatients(query: string) {
  const q = query.trim();
  return prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q.replace(/\D/g, "") } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    take: 100,
  });
}

export function getPatientWithHistory(patientId: string) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        include: { doctor: true, procedureType: true },
        orderBy: { startTime: "desc" },
      },
    },
  });
}
