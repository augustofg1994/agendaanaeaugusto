import { PatientForm } from "../patient-form";

export default function NewPatientPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo paciente</h1>
        <p className="text-muted-foreground">
          Nome, CPF, e-mail, telefone e data de nascimento são obrigatórios.
        </p>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
