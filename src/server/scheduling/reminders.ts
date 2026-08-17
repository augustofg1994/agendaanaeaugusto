import type { Prisma } from "@prisma/client";

const CONFIRMATION_LEAD_HOURS = 48;

/**
 * Cria (ou atualiza, se já existir) o lembrete automático de confirmação de uma consulta,
 * com vencimento 48h antes do horário marcado. Reabre o lembrete (volta para PENDING) caso
 * a consulta seja remarcada depois de já confirmada.
 */
export async function upsertConfirmationReminder(
  tx: Prisma.TransactionClient,
  appointment: { id: string; doctorId: string; patientId: string; startTime: Date; createdById: string }
) {
  const dueDate = new Date(appointment.startTime.getTime() - CONFIRMATION_LEAD_HOURS * 60 * 60 * 1000);

  await tx.reminder.upsert({
    where: { appointmentId: appointment.id },
    create: {
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      message: "Confirmar consulta com o paciente",
      dueDate,
      source: "AUTO_CONFIRMATION",
      createdById: appointment.createdById,
    },
    update: {
      dueDate,
      status: "PENDING",
      resolvedAt: null,
    },
  });
}

/** Remove o lembrete automático de confirmação (ex: ao cancelar a consulta). */
export async function deleteConfirmationReminder(tx: Prisma.TransactionClient, appointmentId: string) {
  await tx.reminder.deleteMany({ where: { appointmentId, source: "AUTO_CONFIRMATION" } });
}
