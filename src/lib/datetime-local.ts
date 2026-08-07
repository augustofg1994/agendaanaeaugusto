/**
 * Converte o valor de um <input type="datetime-local"> (uma string "ingênua", sem fuso)
 * para um ISO string com fuso explícito, interpretando-o no fuso horário do NAVEGADOR
 * (sempre o fuso real do usuário) antes de enviar ao servidor.
 *
 * Sem isso, o servidor reinterpretaria a mesma string "ingênua" no seu próprio fuso
 * (ex: UTC na Vercel), deslocando o horário em produção mesmo que funcione em dev local
 * (onde navegador e servidor compartilham o mesmo fuso).
 */
export function localInputToISOString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

/** Constrói um horário local (fuso do navegador) a partir de um <input type="date"> + hora/minuto fixos. */
export function localDateAndTimeToISOString(
  dateValue: FormDataEntryValue | null,
  hours: number,
  minutes: number
): string | undefined {
  if (typeof dateValue !== "string" || !dateValue) return undefined;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}
