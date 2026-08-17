import { z } from "zod";
import { parseDateOnly } from "@/lib/date-only";

export const createReminderSchema = z.object({
  doctorId: z.string().min(1, "Selecione o médico."),
  patientId: z.string().min(1, "Paciente inválido."),
  message: z.string().trim().min(3, "Descreva o lembrete."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .transform(parseDateOnly)
    .refine((d) => !Number.isNaN(d.getTime()), "Data inválida."),
});
