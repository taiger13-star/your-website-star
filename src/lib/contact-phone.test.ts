import { describe, expect, it } from "vitest";

import { normalizeContactPhone } from "./contact-phone";

describe("normalizeContactPhone", () => {
  it.each([
    ["89034887464", "+79034887464"],
    ["9034887464", "+79034887464"],
    ["+7 (903) 488-74-64", "+79034887464"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+1 (213) 373-4253", "+12133734253"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeContactPhone(input)).toBe(expected);
  });

  it.each([
    "",
    "hello world",
    "12345",
    "+999123456789",
    "+7 903 488 74 64 call me",
    "+7 903 488 74 64 ext. 123",
  ])("rejects %s", (input) => {
    expect(normalizeContactPhone(input)).toBeNull();
  });
});
