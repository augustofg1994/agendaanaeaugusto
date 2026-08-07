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

export const recurrenceEnum = z.enum(["DAILY", "WEEKLY", "BIWEEKLY"]);
export type RecurrenceOption = z.infer<typeof recurrenceEnum>;

export const recurringBlockedTimeSchema = z
  .object({
    doctorId: z.string().min(1),
    startTime: z.string().min(1, "Informe o início."),
    endTime: z.string().min(1, "Informe o fim."),
    type: z.enum(["VACATION", "LUNCH", "UNAVAILABLE", "OTHER"]),
    reason: z.string().trim().optional().or(z.literal("")),
    recurrence: recurrenceEnum,
    until: z.string().min(1, "Informe até quando repetir."),
  })
  .transform((data) => ({
    ...data,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    until: new Date(data.until),
    reason: data.reason || undefined,
  }))
  .refine((data) => data.endTime > data.startTime, {
    message: "O horário final deve ser depois do início.",
    path: ["endTime"],
  })
  .refine((data) => data.until >= data.startTime, {
    message: "A repetição deve terminar depois do início.",
    path: ["until"],
  });
