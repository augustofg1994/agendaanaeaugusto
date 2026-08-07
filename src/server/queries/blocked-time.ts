import { prisma } from "@/server/db/prisma";

export function listBlockedTimeForDoctor(doctorId: string) {
  return prisma.blockedTime.findMany({
    where: { doctorId, endTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
  });
}

export function listBlockedTimeInRange(doctorId: string, from: Date, to: Date) {
  return prisma.blockedTime.findMany({
    where: { doctorId, startTime: { lt: to }, endTime: { gt: from } },
    orderBy: { startTime: "asc" },
  });
}
