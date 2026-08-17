"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertCanManageDoctorAgenda } from "@/server/auth/authorization";
import { findConflicts } from "@/server/scheduling/conflicts";
import { computeEndTime } from "@/server/scheduling/time";
import { createFollowUpIfApplicable } from "@/server/scheduling/followUp";
import { deleteConfirmationReminder, upsertConfirmationReminder } from "@/server/scheduling/reminders";
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/lib/validations/appointment";
import { actionErrorMessage, type ActionResult } from "./action-result";

function conflictMessage(overlappingAppointments: unknown[], overlappingBlockedTime: unknown[]) {
  if (overlappingAppointments.length > 0) {
    return "Já existe uma consulta marcada nesse horário para este médico.";
  }
  if (overlappingBlockedTime.length > 0) {
    return "Esse horário está bloqueado na agenda deste médico.";
  }
  return "Conflito de horário.";
}

export async function createAppointment(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = createAppointmentSchema.parse(input);
    assertCanManageDoctorAgenda(session, data.doctorId);

    const procedureType = await prisma.procedureType.findUnique({
      where: { id: data.procedureTypeId },
      include: { doctors: true },
    });
    if (!procedureType || !procedureType.active) {
      return { ok: false, error: "Procedimento inválido." };
    }
    if (!procedureType.doctors.some((d) => d.doctorId === data.doctorId)) {
      return { ok: false, error: "Este médico não realiza o procedimento selecionado." };
    }

    const startTime = new Date(data.startTime);
    if (Number.isNaN(startTime.getTime())) {
      return { ok: false, error: "Data/horário inválido." };
    }
    const endTime = computeEndTime(startTime, procedureType.defaultDurationMinutes);

    const { overlappingAppointments, overlappingBlockedTime } = await findConflicts({
      doctorId: data.doctorId,
      startTime,
      endTime,
    });
    if (overlappingAppointments.length > 0 || overlappingBlockedTime.length > 0) {
      return { ok: false, error: conflictMessage(overlappingAppointments, overlappingBlockedTime) };
    }

    await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          doctorId: data.doctorId,
          patientId: data.patientId,
          procedureTypeId: data.procedureTypeId,
          startTime,
          endTime,
          notes: data.notes || undefined,
          createdById: session!.user.id,
        },
      });
      await upsertConfirmationReminder(tx, created);
    });

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/reminders");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível criar a consulta.") };
  }
}

export async function rescheduleAppointment(appointmentId: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = rescheduleAppointmentSchema.parse(input);

    const appt = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: { procedureType: true },
    });
    assertCanManageDoctorAgenda(session, appt.doctorId);

    if (appt.status === "CANCELLED") {
      return { ok: false, error: "Não é possível remarcar uma consulta cancelada." };
    }

    const startTime = new Date(data.startTime);
    if (Number.isNaN(startTime.getTime())) {
      return { ok: false, error: "Data/horário inválido." };
    }
    const endTime = computeEndTime(startTime, appt.procedureType.defaultDurationMinutes);

    const { overlappingAppointments, overlappingBlockedTime } = await findConflicts({
      doctorId: appt.doctorId,
      startTime,
      endTime,
      excludeAppointmentId: appt.id,
    });
    if (overlappingAppointments.length > 0 || overlappingBlockedTime.length > 0) {
      return { ok: false, error: conflictMessage(overlappingAppointments, overlappingBlockedTime) };
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime,
          endTime,
          // Um retorno sugerido que é remarcado passa a ser um agendamento confirmado.
          status: appt.status === "PENDING_CONFIRMATION" ? "SCHEDULED" : appt.status,
        },
      });
      // Reabre (ou cria) o lembrete de confirmação com o novo horário — remarcar exige
      // confirmar de novo com o paciente.
      await upsertConfirmationReminder(tx, { ...appt, startTime });
    });

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/reminders");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível remarcar a consulta.") };
  }
}

export async function cancelAppointment(appointmentId: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = cancelAppointmentSchema.parse(input);

    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    assertCanManageDoctorAgenda(session, appt.doctorId);

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: data.reason || undefined },
      });
      // Consulta cancelada não precisa mais ser confirmada com o paciente.
      await deleteConfirmationReminder(tx, appointmentId);
    });

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/reminders");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível cancelar a consulta.") };
  }
}

export async function deleteAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    assertCanManageDoctorAgenda(session, appt.doctorId);

    await prisma.$transaction([
      // Retornos gerados a partir desta consulta deixam de referenciá-la, mas continuam existindo.
      prisma.appointment.updateMany({
        where: { followUpOfAppointmentId: appointmentId },
        data: { followUpOfAppointmentId: null },
      }),
      prisma.appointment.delete({ where: { id: appointmentId } }),
    ]);

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/follow-ups");
    revalidatePath("/reminders");
    revalidatePath(`/patients/${appt.patientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível excluir a consulta.") };
  }
}

export async function confirmPendingAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    assertCanManageDoctorAgenda(session, appt.doctorId);

    if (appt.status !== "PENDING_CONFIRMATION") {
      return { ok: false, error: "Esta consulta não está pendente de confirmação." };
    }

    const { overlappingAppointments, overlappingBlockedTime } = await findConflicts({
      doctorId: appt.doctorId,
      startTime: appt.startTime,
      endTime: appt.endTime,
      excludeAppointmentId: appt.id,
    });
    if (overlappingAppointments.length > 0 || overlappingBlockedTime.length > 0) {
      return { ok: false, error: conflictMessage(overlappingAppointments, overlappingBlockedTime) };
    }

    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "SCHEDULED" } });

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/follow-ups");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível confirmar o retorno.") };
  }
}

export async function completeAppointment(appointmentId: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const appt = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: { procedureType: true },
    });
    assertCanManageDoctorAgenda(session, appt.doctorId);

    if (appt.status !== "SCHEDULED") {
      return { ok: false, error: "Só é possível concluir consultas agendadas." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });
      await createFollowUpIfApplicable(tx, appt);
    });

    revalidatePath("/agenda/[doctorId]", "page");
    revalidatePath("/follow-ups");
    revalidatePath(`/patients/${appt.patientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível concluir a consulta.") };
  }
}
