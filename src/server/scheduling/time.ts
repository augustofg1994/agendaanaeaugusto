export function computeEndTime(startTime: Date, durationMinutes: number): Date {
  return new Date(startTime.getTime() + durationMinutes * 60_000);
}

/** Soma dias preservando o horário do dia (usado para sugerir data de retorno). */
export function addDaysPreservingTime(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Duas faixas [startA,endA) e [startB,endB) se sobrepõem se startA < endB e endA > startB. */
export function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}
