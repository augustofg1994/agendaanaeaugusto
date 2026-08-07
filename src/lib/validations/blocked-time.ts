import { z } from "zod";

export const blockedTimeSchema = z
  .object({
    doctorId: z.string().min(1),
    startTime: z.string().min(1, "Informe o início."),
    endTime: z.string().min(1, "Informe o fim."),
    type: z.enum(["VACATION", "LUNCH", "UNAVAILABLE", "OTHER"]),
    reason: z.string().trim().optional().or(z.literal("")),
  })
  .transform((data) => ({
    ...data,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    reason: data.reason || undefined,
  }))
  .refine((data) => data.endTime > data.startTime, {
    message: "O horário final deve ser depois do início.",
    path: ["endTime"],
  });
