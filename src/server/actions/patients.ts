"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { getAuthSession } from "@/server/auth/session";
import { patientSchema } from "@/lib/validations/patient";
import { actionErrorMessage, type ActionResult } from "./action-result";

function emptyToUndefined(v: FormDataEntryValue | null) {
  const s = (v as string | null) ?? "";
  return s.trim() === "" ? undefined : s;
}

function patientInputFromFormData(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    addressStreet: emptyToUndefined(formData.get("addressStreet")),
    addressNumber: emptyToUndefined(formData.get("addressNumber")),
    addressComplement: emptyToUndefined(formData.get("addressComplement")),
    addressNeighborhood: emptyToUndefined(formData.get("addressNeighborhood")),
    addressCity: emptyToUndefined(formData.get("addressCity")),
    addressState: emptyToUndefined(formData.get("addressState")),
    addressZipCode: emptyToUndefined(formData.get("addressZipCode")),
  };
}

export async function createPatient(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await getAuthSession();
  if (!session) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const parsed = patientSchema.safeParse(patientInputFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.patient.findUnique({ where: { cpf: parsed.data.cpf } });
  if (existing) {
    return { ok: false, error: "Já existe um paciente cadastrado com este CPF." };
  }

  let patientId: string;
  try {
    const patient = await prisma.patient.create({ data: parsed.data });
    patientId = patient.id;
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível cadastrar o paciente.") };
  }

  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}

export async function updatePatient(
  patientId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getAuthSession();
  if (!session) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const parsed = patientSchema.safeParse(patientInputFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.patient.findUnique({ where: { cpf: parsed.data.cpf } });
  if (existing && existing.id !== patientId) {
    return { ok: false, error: "Já existe outro paciente cadastrado com este CPF." };
  }

  try {
    await prisma.patient.update({ where: { id: patientId }, data: parsed.data });
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível atualizar o paciente.") };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}

export async function updateAppointmentNotes(appointmentId: string, notes: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    if (!session) return { ok: false, error: "Sessão expirada." };

    const appt = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });

    const { assertCanManageDoctorAgenda } = await import("@/server/auth/authorization");
    assertCanManageDoctorAgenda(session, appt.doctorId);

    await prisma.appointment.update({ where: { id: appointmentId }, data: { notes } });
    revalidatePath(`/patients/${appt.patientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionErrorMessage(err, "Não foi possível salvar as observações.") };
  }
}
