"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertCanManageDoctorAgenda } from "@/server/auth/authorization";
import { blockedTimeSchema } from "@/lib/validations/blocked-time";
import { actionErrorMessage, type ActionResult } from "./action-result";

export async function createBlockedTime(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = blockedTimeSchema.parse(input);
    assertCanManageDoctorAgenda(session, data.doctorId);

    await prisma.blockedTime.create({
      data: {
        doctorId: data.doctorId,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        reason: data.reason,
      },
    });

    revalidatePath("/blocked-time");
    revalidatePath("/agenda/[doctorId]", "page");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível criar o bloqueio.") };
  }
}

export async function deleteBlockedTime(blockedTimeId: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const existing = await prisma.blockedTime.findUniqueOrThrow({ where: { id: blockedTimeId } });
    assertCanManageDoctorAgenda(session, existing.doctorId);

    await prisma.blockedTime.delete({ where: { id: blockedTimeId } });

    revalidatePath("/blocked-time");
    revalidatePath("/agenda/[doctorId]", "page");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível remover o bloqueio.") };
  }
}
