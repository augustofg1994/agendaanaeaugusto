"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { assertIsAdmin } from "@/server/auth/authorization";
import { hashPassword } from "@/lib/password";
import {
  createSecretarySchema,
  resetPasswordAdminSchema,
  setSecretaryDoctorLinkSchema,
} from "@/lib/validations/user";
import { actionErrorMessage, type ActionResult } from "./action-result";

export async function createSecretary(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    const data = createSecretarySchema.parse(input);

    const doctor = await prisma.user.findUnique({ where: { id: data.linkedDoctorId } });
    if (!doctor || doctor.role !== "DOCTOR") {
      return { ok: false, error: "Médico selecionado é inválido." };
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return { ok: false, error: "Já existe um usuário com este e-mail." };
    }

    const passwordHash = await hashPassword(data.password);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "SECRETARY",
        linkedDoctorId: data.linkedDoctorId,
      },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível criar o secretário.") };
  }
}

export async function setSecretaryDoctorLink(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    const data = setSecretaryDoctorLinkSchema.parse(input);

    const [user, doctor] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.userId } }),
      prisma.user.findUnique({ where: { id: data.linkedDoctorId } }),
    ]);
    if (!user || user.role !== "SECRETARY") {
      return { ok: false, error: "Usuário inválido." };
    }
    if (!doctor || doctor.role !== "DOCTOR") {
      return { ok: false, error: "Médico selecionado é inválido." };
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { linkedDoctorId: data.linkedDoctorId },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o vínculo.") };
  }
}

export async function resetPasswordAdmin(input: unknown): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    const data = resetPasswordAdminSchema.parse(input);
    const passwordHash = await hashPassword(data.password);

    await prisma.user.update({
      where: { id: data.userId },
      data: { passwordHash },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível redefinir a senha.") };
  }
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    assertIsAdmin(session);

    if (session!.user.id === userId && !active) {
      return { ok: false, error: "Você não pode desativar sua própria conta." };
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { ok: false, error: "Usuário não encontrado." };

    if (target.role === "DOCTOR" && !active) {
      const otherActiveDoctors = await prisma.user.count({
        where: { role: "DOCTOR", active: true, id: { not: userId } },
      });
      if (otherActiveDoctors === 0) {
        return { ok: false, error: "Não é possível desativar o último médico ativo." };
      }
    }

    await prisma.user.update({ where: { id: userId }, data: { active } });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o usuário.") };
  }
}
