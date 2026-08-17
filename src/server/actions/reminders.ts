"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertCanManageDoctorAgenda } from "@/server/auth/authorization";
import { createReminderSchema } from "@/lib/validations/reminder";
import { actionErrorMessage, type ActionResult } from "./action-result";

export async function createReminder(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = createReminderSchema.parse(input);
    assertCanManageDoctorAgenda(session, data.doctorId);

    await prisma.reminder.create({
      data: {
        doctorId: data.doctorId,
        patientId: data.patientId,
        message: data.message,
        dueDate: data.dueDate,
        source: "MANUAL",
        createdById: session!.user.id,
      },
    });

    revalidatePath("/reminders");
    revalidatePath(`/patients/${data.patientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível criar o lembrete.") };
  }
}

export async function setReminderStatus(
  reminderId: string,
  status: "PENDING" | "RESOLVED"
): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const reminder = await prisma.reminder.findUniqueOrThrow({ where: { id: reminderId } });
    assertCanManageDoctorAgenda(session, reminder.doctorId);

    await prisma.reminder.update({
      where: { id: reminderId },
      data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
    });

    revalidatePath("/reminders");
    revalidatePath(`/patients/${reminder.patientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o lembrete.") };
  }
}
