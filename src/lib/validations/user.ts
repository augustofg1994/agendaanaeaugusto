import { z } from "zod";

export const createSecretarySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  linkedDoctorId: z.string().min(1, "Selecione o médico responsável."),
});

export const resetPasswordAdminSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const setSecretaryDoctorLinkSchema = z.object({
  userId: z.string().min(1),
  linkedDoctorId: z.string().min(1, "Selecione o médico responsável."),
});
