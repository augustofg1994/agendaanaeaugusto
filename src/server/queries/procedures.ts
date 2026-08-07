import { prisma } from "@/server/db/prisma";

export function listProcedureTypes({ onlyActive = false }: { onlyActive?: boolean } = {}) {
  return prisma.procedureType.findMany({
    where: onlyActive ? { active: true } : undefined,
    include: { doctors: { include: { doctor: true } } },
    orderBy: { name: "asc" },
  });
}

export function listProcedureTypesForDoctor(doctorId: string) {
  return prisma.procedureType.findMany({
    where: { active: true, doctors: { some: { doctorId } } },
    orderBy: { name: "asc" },
  });
}
