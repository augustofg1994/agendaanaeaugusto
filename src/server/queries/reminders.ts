import { prisma } from "@/server/db/prisma";
import { startOfDay, addDays } from "@/lib/agenda-range";

/** Lembretes de um paciente específico — usado na ficha do paciente. */
export function listRemindersForPatient(patientId: string) {
  return prisma.reminder.findMany({
    where: { patientId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

/** Todos os lembretes com vencimento dentro do intervalo — usado na visão mensal. */
export function listRemindersInRange(doctorIds: string[], from: Date, to: Date) {
  if (doctorIds.length === 0) return Promise.resolve([]);
  return prisma.reminder.findMany({
    where: { doctorId: { in: doctorIds }, dueDate: { gte: from, lt: to } },
    include: { patient: true, doctor: true },
    orderBy: { dueDate: "asc" },
  });
}

/**
 * Lembretes relevantes para um dia específico — usado na visão diária:
 * `overdue` = pendentes com vencimento antes do dia (carregam até serem resolvidos);
 * `dueToday` = com vencimento no próprio dia, independente do status.
 */
export async function listRemindersForDay(doctorIds: string[], day: Date) {
  if (doctorIds.length === 0) return { overdue: [], dueToday: [] };

  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  const [overdue, dueToday] = await Promise.all([
    prisma.reminder.findMany({
      where: { doctorId: { in: doctorIds }, status: "PENDING", dueDate: { lt: dayStart } },
      include: { patient: true, doctor: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.reminder.findMany({
      where: { doctorId: { in: doctorIds }, dueDate: { gte: dayStart, lt: dayEnd } },
      include: { patient: true, doctor: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return { overdue, dueToday };
}
