import { resend } from "./resend";

export async function sendPasswordResetEmail(to: string, rawToken: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password/${rawToken}`;
  const from = process.env.EMAIL_FROM || "Clínica <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject: "Redefinição de senha — Agenda da Clínica",
    html: `
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a></p>
      <p>Este link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
    `,
  });
}
