/**
 * Força o processo Node a rodar sempre no fuso da clínica (América/São_Paulo),
 * independente de onde o servidor está hospedado (ex: Vercel roda em UTC por padrão).
 * Sem isso, cálculos "meia-noite local" feitos no servidor (início do dia/semana da
 * agenda, etc.) ficariam deslocados em relação ao horário real do Brasil em produção.
 */
export function register() {
  process.env.TZ = "America/Sao_Paulo";
}
