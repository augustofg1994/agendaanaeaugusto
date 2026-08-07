import { notFound } from "next/navigation";
import { getPatientWithHistory } from "@/server/queries/patients";
import { formatCpf } from "@/lib/cpf";
import { formatDateOnlyInput } from "@/lib/date-only";
import { PatientForm } from "../../patient-form";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientWithHistory(id);
  if (!patient) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar paciente</h1>
        <p className="text-muted-foreground">{patient.fullName}</p>
      </div>
      <PatientForm
        mode="edit"
        patientId={patient.id}
        defaults={{
          fullName: patient.fullName,
          cpf: formatCpf(patient.cpf),
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: formatDateOnlyInput(patient.dateOfBirth),
          addressStreet: patient.addressStreet ?? "",
          addressNumber: patient.addressNumber ?? "",
          addressComplement: patient.addressComplement ?? "",
          addressNeighborhood: patient.addressNeighborhood ?? "",
          addressCity: patient.addressCity ?? "",
          addressState: patient.addressState ?? "",
          addressZipCode: patient.addressZipCode ?? "",
        }}
      />
    </div>
  );
}
