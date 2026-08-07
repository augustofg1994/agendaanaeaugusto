import { prisma } from "@/server/db/prisma";

export type ConflictCheckParams = {
  doctorId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
};

/**
 * Verifica conflitos de horário para um médico: consultas já marcadas (SCHEDULED/COMPLETED)
 * e bloqueios de horário que se sobrepõem ao intervalo informado.
 *
 * CANCELLED nunca bloqueia. PENDING_CONFIRMATION (sugestão automática de retorno) também não
 * bloqueia — é só uma sugestão; passa a valer normalmente quando alguém a confirma/edita.
 */
export async function findConflicts({
  doctorId,
  startTime,
  endTime,
  excludeAppointmentId,
}: ConflictCheckParams) {
  const [overlappingAppointments, overlappingBlockedTime] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ["SCHEDULED", "COMPLETED"] },
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: { patient: true },
    }),
    prisma.blockedTime.findMany({
      where: {
        doctorId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
  ]);

  return { overlappingAppointments, overlappingBlockedTime };
}

export async function hasConflict(params: ConflictCheckParams): Promise<boolean> {
  const { overlappingAppointments, overlappingBlockedTime } = await findConflicts(params);
  return overlappingAppointments.length > 0 || overlappingBlockedTime.length > 0;
}
