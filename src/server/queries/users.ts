import { prisma } from "@/server/db/prisma";

export function listAllUsers() {
  return prisma.user.findMany({
    include: { linkedDoctor: { select: { id: true, name: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export function listDoctors({ onlyActive = true }: { onlyActive?: boolean } = {}) {
  return prisma.user.findMany({
    where: { role: "DOCTOR", ...(onlyActive ? { active: true } : {}) },
    orderBy: { name: "asc" },
  });
}
