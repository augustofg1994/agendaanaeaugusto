"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createPatient, updatePatient } from "@/server/actions/patients";
import type { ActionResult } from "@/server/actions/action-result";

type PatientDefaults = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  dateOfBirth: string; // yyyy-mm-dd
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
};

const emptyDefaults: PatientDefaults = {
  fullName: "",
  cpf: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
};

export function PatientForm({
  mode,
  patientId,
  defaults = emptyDefaults,
}: {
  mode: "create" | "edit";
  patientId?: string;
  defaults?: PatientDefaults;
}) {
  const action =
    mode === "create" ? createPatient : updatePatient.bind(null, patientId!);

  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" name="fullName" defaultValue={defaults.fullName} required />
            <Field label="CPF" name="cpf" defaultValue={defaults.cpf} required placeholder="000.000.000-00" />
            <Field label="E-mail" name="email" type="email" defaultValue={defaults.email} required />
            <Field label="Telefone" name="phone" defaultValue={defaults.phone} required />
            <Field
              label="Data de nascimento"
              name="dateOfBirth"
              type="date"
              defaultValue={defaults.dateOfBirth}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Endereço (opcional)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rua" name="addressStreet" defaultValue={defaults.addressStreet} />
              <Field label="Número" name="addressNumber" defaultValue={defaults.addressNumber} />
              <Field label="Complemento" name="addressComplement" defaultValue={defaults.addressComplement} />
              <Field label="Bairro" name="addressNeighborhood" defaultValue={defaults.addressNeighborhood} />
              <Field label="Cidade" name="addressCity" defaultValue={defaults.addressCity} />
              <Field label="Estado" name="addressState" defaultValue={defaults.addressState} />
              <Field label="CEP" name="addressZipCode" defaultValue={defaults.addressZipCode} />
            </div>
          </div>

          {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : mode === "create" ? "Cadastrar paciente" : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
