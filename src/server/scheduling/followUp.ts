import { addDaysPreservingTime, computeEndTime } from "./time";
import type { Appointment, Prisma, ProcedureType } from "@prisma/client";

/**
 * Se o procedimento da consulta concluída tiver `followUpDays`, cria automaticamente uma
 * nova consulta com status PENDING_CONFIRMATION sugerindo o retorno. Não faz checagem de
 * conflito aqui — é só uma sugestão; a checagem normal roda quando alguém confirma/edita.
 */
export async function createFollowUpIfApplicable(
  tx: Prisma.TransactionClient,
  appointment: Appointment & { procedureType: ProcedureType }
) {
  if (appointment.procedureType.followUpDays == null) return null;

  const followUpStart = addDaysPreservingTime(appointment.startTime, appointment.procedureType.followUpDays);
  const followUpEnd = computeEndTime(followUpStart, appointment.procedureType.defaultDurationMinutes);

  return tx.appointment.create({
    data: {
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      procedureTypeId: appointment.procedureTypeId,
      startTime: followUpStart,
      endTime: followUpEnd,
      status: "PENDING_CONFIRMATION",
      followUpOfAppointmentId: appointment.id,
      createdById: appointment.createdById,
    },
  });
}
