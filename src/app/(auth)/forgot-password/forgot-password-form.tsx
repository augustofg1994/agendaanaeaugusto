"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/password-reset";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await requestPasswordReset({ email: formData.get("email") });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Se houver uma conta com este e-mail, enviamos um link para redefinir a senha. Verifique sua
        caixa de entrada (e o spam).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="underline underline-offset-4 hover:text-foreground">
          Voltar para o login
        </a>
      </p>
    </form>
  );
}
