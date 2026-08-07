export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export function formatCpf(cpf: string) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/** Valida CPF pelo algoritmo de dígitos verificadores (aceita apenas dígitos, já normalizado). */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos os dígitos iguais

  const calcCheckDigit = (base: string) => {
    let sum = 0;
    let factor = base.length + 1;
    for (const char of base) {
      sum += Number(char) * factor;
      factor -= 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base9 = digits.slice(0, 9);
  const digit1 = calcCheckDigit(base9);
  const digit2 = calcCheckDigit(base9 + digit1);

  return digits === base9 + String(digit1) + String(digit2);
}
