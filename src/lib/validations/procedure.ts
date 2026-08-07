import { z } from "zod";

export const procedureColorValues = ["GREEN", "BLUE", "ORANGE", "PURPLE", "PINK", "GRAY"] as const;

export const procedureTypeSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do procedimento."),
  defaultDurationMinutes: z.coerce.number().int().min(5, "Duração mínima de 5 minutos.").max(480),
  followUpDays: z
    .union([z.coerce.number().int().min(1).max(365), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  color: z.enum(procedureColorValues),
  doctorIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um médico."),
});

export type ProcedureTypeInput = z.infer<typeof procedureTypeSchema>;
