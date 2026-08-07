import { z } from "zod";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";
import { parseDateOnly } from "@/lib/date-only";

export const patientSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  cpf: z
    .string()
    .trim()
    .transform(normalizeCpf)
    .refine((v) => isValidCpf(v), "CPF inválido."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  phone: z.string().trim().min(8, "Informe um telefone válido."),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.")
    .transform(parseDateOnly)
    .refine((d) => !Number.isNaN(d.getTime()), "Data de nascimento inválida."),
  addressStreet: z.string().trim().optional().or(z.literal("")),
  addressNumber: z.string().trim().optional().or(z.literal("")),
  addressComplement: z.string().trim().optional().or(z.literal("")),
  addressNeighborhood: z.string().trim().optional().or(z.literal("")),
  addressCity: z.string().trim().optional().or(z.literal("")),
  addressState: z.string().trim().optional().or(z.literal("")),
  addressZipCode: z.string().trim().optional().or(z.literal("")),
});

export type PatientInput = z.infer<typeof patientSchema>;
