"use server";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/lib/password";
import { requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validations/password-reset";
import { sendPasswordResetEmail } from "@/server/email/send-password-reset";
import { actionErrorMessage, type ActionResult } from "./action-result";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

const GENERIC_SUCCESS: ActionResult = { ok: true };

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  try {
    const { email } = requestPasswordResetSchema.parse(input);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.active) {
      const rawToken = randomBytes(32).toString("hex");
      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        }),
      ]);

      await sendPasswordResetEmail(user.email, rawToken);
    }

    // Mensagem genérica sempre, exista ou não o e-mail (evita enumeração de usuários).
    return GENERIC_SUCCESS;
  } catch (err) {
    // Mesmo em erro inesperado, não vazamos detalhes que ajudem a enumerar contas.
    return { ok: false, error: actionErrorMessage(err, "Não foi possível processar a solicitação.") };
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  try {
    const { token, password } = resetPasswordSchema.parse(input);
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    const invalid =
      !resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date();

    if (invalid) {
      return { ok: false, error: "Link inválido ou expirado. Solicite uma nova redefinição." };
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
      }),
    ]);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível redefinir a senha.") };
  }
}
