export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 20;
export const PIXELS_PER_HOUR = 56;
export const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PIXELS_PER_HOUR;

/** Posição vertical em pixels dentro da grade, a partir de DAY_START_HOUR. */
export function minutesFromDayStart(date: Date): number {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}

export function pixelsFromDayStart(date: Date): number {
  return (minutesFromDayStart(date) / 60) * PIXELS_PER_HOUR;
}

export function durationPixels(start: Date, end: Date): number {
  const minutes = (end.getTime() - start.getTime()) / 60_000;
  return Math.max((minutes / 60) * PIXELS_PER_HOUR, 18);
}

/** Converte um deslocamento vertical (px) dentro da grade em um horário daquele dia, arredondado para 15min. */
export function timeAtPixelOffset(day: Date, offsetY: number): Date {
  const minutesFromStart = (offsetY / GRID_HEIGHT) * (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const snapped = Math.round(minutesFromStart / 15) * 15;
  const clamped = Math.min(Math.max(snapped, 0), (DAY_END_HOUR - DAY_START_HOUR) * 60);
  const result = new Date(day);
  result.setHours(DAY_START_HOUR, 0, 0, 0);
  result.setMinutes(clamped);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export const HOURS_RANGE = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => DAY_START_HOUR + i
);
