"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertCanManageDoctorAgenda } from "@/server/auth/authorization";
import {
  blockedTimeSchema,
  recurringBlockedTimeSchema,
  type RecurrenceOption,
} from "@/lib/validations/blocked-time";
import { actionErrorMessage, type ActionResult } from "./action-result";

const RECURRENCE_INTERVAL_DAYS: Record<RecurrenceOption, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 15,
};

/** Limite de segurança para evitar criar um número absurdo de bloqueios por engano. */
const MAX_RECURRING_OCCURRENCES = 200;

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

export async function createRecurringBlockedTime(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const data = recurringBlockedTimeSchema.parse(input);
    assertCanManageDoctorAgenda(session, data.doctorId);

    const durationMs = data.endTime.getTime() - data.startTime.getTime();
    const intervalMs = RECURRENCE_INTERVAL_DAYS[data.recurrence] * 24 * 60 * 60 * 1000;

    const occurrences: { startTime: Date; endTime: Date }[] = [];
    for (
      let cursor = data.startTime.getTime();
      cursor <= data.until.getTime() && occurrences.length < MAX_RECURRING_OCCURRENCES;
      cursor += intervalMs
    ) {
      occurrences.push({ startTime: new Date(cursor), endTime: new Date(cursor + durationMs) });
    }

    if (occurrences.length === 0) {
      return { ok: false, error: "Nenhuma data válida dentro do período informado." };
    }

    await prisma.blockedTime.createMany({
      data: occurrences.map((o) => ({
        doctorId: data.doctorId,
        startTime: o.startTime,
        endTime: o.endTime,
        type: data.type,
        reason: data.reason,
      })),
    });

    revalidatePath("/blocked-time");
    revalidatePath("/agenda/[doctorId]", "page");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: actionErrorMessage(err, "Não foi possível criar os bloqueios recorrentes."),
    };
  }
}

export async function updateBlockedTime(blockedTimeId: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    const existing = await prisma.blockedTime.findUniqueOrThrow({ where: { id: blockedTimeId } });
    assertCanManageDoctorAgenda(session, existing.doctorId);

    const data = blockedTimeSchema.parse(input);
    assertCanManageDoctorAgenda(session, data.doctorId);

    await prisma.blockedTime.update({
      where: { id: blockedTimeId },
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
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o bloqueio.") };
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
