export type AgendaView = "day" | "week" | "month";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Segunda-feira como início de semana. */
function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getAgendaRange(view: AgendaView, date: Date): { from: Date; to: Date } {
  if (view === "day") {
    const from = startOfDay(date);
    return { from, to: addDays(from, 1) };
  }
  if (view === "week") {
    const from = startOfWeek(date);
    return { from, to: addDays(from, 7) };
  }
  // month: mostra a grade completa (pode incluir dias de semanas adjacentes)
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const gridEnd = addDays(startOfWeek(monthEnd), monthEnd.getDay() === 1 ? 0 : 7);
  return { from: gridStart, to: gridEnd };
}

export function shiftDate(view: AgendaView, date: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, 7 * direction);
  return new Date(date.getFullYear(), date.getMonth() + direction, 1);
}

export function parseDateParam(value: string | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export { startOfDay, addDays, startOfWeek, startOfMonth };
