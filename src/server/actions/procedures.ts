"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertIsAdmin } from "@/server/auth/authorization";
import { procedureTypeSchema } from "@/lib/validations/procedure";
import { actionErrorMessage, type ActionResult } from "./action-result";

function inputFromPayload(input: unknown) {
  return procedureTypeSchema.parse(input);
}

export async function createProcedureType(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    const data = inputFromPayload(input);

    await prisma.procedureType.create({
      data: {
        name: data.name,
        defaultDurationMinutes: data.defaultDurationMinutes,
        followUpDays: data.followUpDays,
        color: data.color,
        doctors: { create: data.doctorIds.map((doctorId) => ({ doctorId })) },
      },
    });

    revalidatePath("/procedures");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível criar o procedimento.") };
  }
}

export async function updateProcedureType(procedureTypeId: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    const data = inputFromPayload(input);

    await prisma.$transaction([
      prisma.procedureType.update({
        where: { id: procedureTypeId },
        data: {
          name: data.name,
          defaultDurationMinutes: data.defaultDurationMinutes,
          followUpDays: data.followUpDays,
          color: data.color,
        },
      }),
      prisma.procedureDoctor.deleteMany({ where: { procedureTypeId } }),
      prisma.procedureDoctor.createMany({
        data: data.doctorIds.map((doctorId) => ({ procedureTypeId, doctorId })),
      }),
    ]);

    revalidatePath("/procedures");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o procedimento.") };
  }
}

export async function setProcedureTypeActive(procedureTypeId: string, active: boolean): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    await prisma.procedureType.update({ where: { id: procedureTypeId }, data: { active } });
    revalidatePath("/procedures");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o procedimento.") };
  }
}
