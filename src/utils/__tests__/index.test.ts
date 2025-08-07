import { formatDate, validateEmail, validateUrl, generateId } from "../index";

describe("Utils", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15");
      const formatted = formatDate(date);
      expect(formatted).toBe("2024. 1. 15.");
    });
  });

  describe("validateEmail", () => {
    it("should validate valid email", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user@domain.co.kr")).toBe(true);
    });

    it("should reject invalid email", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
    });
  });

  describe("validateUrl", () => {
    it("should validate valid URLs", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("http://localhost:3000")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(validateUrl("not-a-url")).toBe(false);
      expect(validateUrl("")).toBe(false);
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
