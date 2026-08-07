import { describe, expect, it } from "vitest";
import { addDaysPreservingTime, computeEndTime, intervalsOverlap } from "./time";

describe("computeEndTime", () => {
  it("soma a duração em minutos", () => {
    const start = new Date("2026-01-01T10:00:00.000Z");
    expect(computeEndTime(start, 30).toISOString()).toBe("2026-01-01T10:30:00.000Z");
  });
});

describe("addDaysPreservingTime", () => {
  it("mantém o horário do dia ao somar dias", () => {
    const start = new Date(2026, 0, 1, 14, 30);
    const result = addDaysPreservingTime(start, 7);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });
});

describe("intervalsOverlap", () => {
  const d = (s: string) => new Date(`2026-01-01T${s}:00.000Z`);

  it("detecta sobreposição parcial", () => {
    expect(intervalsOverlap(d("10:00"), d("11:00"), d("10:30"), d("11:30"))).toBe(true);
  });

  it("detecta um intervalo contido no outro", () => {
    expect(intervalsOverlap(d("10:00"), d("12:00"), d("10:30"), d("11:00"))).toBe(true);
  });

  it("não detecta sobreposição quando os intervalos são adjacentes", () => {
    expect(intervalsOverlap(d("10:00"), d("11:00"), d("11:00"), d("12:00"))).toBe(false);
  });

  it("não detecta sobreposição quando os intervalos são distantes", () => {
    expect(intervalsOverlap(d("10:00"), d("11:00"), d("14:00"), d("15:00"))).toBe(false);
  });
});
