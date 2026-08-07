"use client";

import { useActionState, useState } from "react";
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

function formatZipCode(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
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

  const [zipCode, setZipCode] = useState(defaults.addressZipCode);
  const [address, setAddress] = useState({
    street: defaults.addressStreet,
    neighborhood: defaults.addressNeighborhood,
    city: defaults.addressCity,
    state: defaults.addressState,
  });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "not-found" | "error">("idle");

  async function handleZipCodeChange(rawValue: string) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    setZipCode(formatZipCode(digits));

    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }

    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data: ViaCepResponse = await res.json();

      if (data.erro) {
        setCepStatus("not-found");
        return;
      }

      setAddress({
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      });
      setCepStatus("idle");
    } catch {
      setCepStatus("error");
    }
  }

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
              <div className="space-y-2">
                <Label htmlFor="addressZipCode">CEP</Label>
                <Input
                  id="addressZipCode"
                  name="addressZipCode"
                  value={zipCode}
                  onChange={(e) => handleZipCodeChange(e.target.value)}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                {cepStatus === "loading" && (
                  <p className="text-xs text-muted-foreground">Buscando endereço...</p>
                )}
                {cepStatus === "not-found" && (
                  <p className="text-xs text-destructive">CEP não encontrado — preencha manualmente.</p>
                )}
                {cepStatus === "error" && (
                  <p className="text-xs text-muted-foreground">
                    Não foi possível buscar o CEP — preencha manualmente.
                  </p>
                )}
              </div>
              <Field label="Número" name="addressNumber" defaultValue={defaults.addressNumber} />
              <Field
                label="Rua"
                name="addressStreet"
                value={address.street}
                onChange={(v) => setAddress((a) => ({ ...a, street: v }))}
              />
              <Field label="Complemento" name="addressComplement" defaultValue={defaults.addressComplement} />
              <Field
                label="Bairro"
                name="addressNeighborhood"
                value={address.neighborhood}
                onChange={(v) => setAddress((a) => ({ ...a, neighborhood: v }))}
              />
              <Field
                label="Cidade"
                name="addressCity"
                value={address.city}
                onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
              />
              <Field
                label="Estado"
                name="addressState"
                value={address.state}
                onChange={(v) => setAddress((a) => ({ ...a, state: v }))}
              />
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
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const isControlled = value !== undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        {...(isControlled
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : { defaultValue })}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
