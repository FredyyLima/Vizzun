import { describe, it, expect } from "vitest";
import { formatCurrency, formatCnpj } from "./dashboard-formatters";

describe("formatCurrency", () => {
  it("formats digits as BRL currency", () => {
    expect(formatCurrency("800000")).toBe("R$ 8.000,00");
  });

  it("ignores non-digit characters", () => {
    expect(formatCurrency("R$ 1.234,56")).toBe(formatCurrency("123456"));
  });

  it("returns empty string when there are no digits", () => {
    expect(formatCurrency("abc")).toBe("");
  });
});

describe("formatCnpj", () => {
  it("returns empty string for falsy input", () => {
    expect(formatCnpj(undefined)).toBe("");
    expect(formatCnpj(null)).toBe("");
    expect(formatCnpj("")).toBe("");
  });

  it("formats a full CNPJ with mask", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("progressively masks partial input", () => {
    expect(formatCnpj("12")).toBe("12");
    expect(formatCnpj("123456")).toBe("12.345.6");
    expect(formatCnpj("123456780001")).toBe("12.345.678/0001");
  });

  it("strips non-digit characters and caps at 14 digits", () => {
    expect(formatCnpj("12.345.678/0001-99extra")).toBe("12.345.678/0001-99");
  });
});
