import { describe, expect, it } from "vitest";
import { isValidCpf, normalizeCpf, formatCpf } from "./cpf";

describe("cpf", () => {
  it("valida um CPF correto", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(isValidCpf("111.444.777-36")).toBe(false);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("rejeita CPF com tamanho errado", () => {
    expect(isValidCpf("123")).toBe(false);
  });

  it("normaliza removendo pontuação", () => {
    expect(normalizeCpf("111.444.777-35")).toBe("11144477735");
  });

  it("formata CPF normalizado", () => {
    expect(formatCpf("11144477735")).toBe("111.444.777-35");
  });
});
