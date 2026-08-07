import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});
