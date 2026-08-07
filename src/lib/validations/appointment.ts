import { z } from "zod";

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Selecione o médico."),
  patientId: z.string().min(1, "Selecione o paciente."),
  procedureTypeId: z.string().min(1, "Selecione o procedimento."),
  startTime: z.string().min(1, "Informe a data e horário."),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const rescheduleAppointmentSchema = z.object({
  startTime: z.string().min(1, "Informe a data e horário."),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().optional().or(z.literal("")),
});
