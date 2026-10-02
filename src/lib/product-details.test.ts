import { describe, expect, it } from "vitest";

import {
  displaySize,
  EMPTY_MEASUREMENTS,
  resolveSpecifications,
  type PublicSpecificationSection,
} from "./product-details";

describe("product detail helpers", () => {
  it("formats a round size as a customer-readable geometry", () => {
    expect(
      displaySize("M", { ...EMPTY_MEASUREMENTS, outerDiameterMm: 240, outerHeightMm: 260 }),
    ).toBe("M — Ø240 × H260 мм");
  });

  it("uses a selected variant specification over the object-level value", () => {
    const sections: PublicSpecificationSection[] = [
      {
        id: "object",
        title: "Комплектация",
        sortOrder: 0,
        items: [
          {
            id: "base",
            variantId: null,
            code: "components",
            label: "Комплектация",
            value: "Корпус и поддон",
            unit: null,
            sortOrder: 0,
          },
          {
            id: "smart",
            variantId: "smart-m",
            code: "components",
            label: "Комплектация",
            value: "Корпус, вставка и резервуар",
            unit: null,
            sortOrder: 0,
          },
        ],
      },
    ];

    expect(resolveSpecifications(sections, "smart-m")[0]?.items[0]?.value).toBe(
      "Корпус, вставка и резервуар",
    );
    expect(resolveSpecifications(sections, "standard-m")[0]?.items[0]?.value).toBe(
      "Корпус и поддон",
    );
  });

  it("does not surface a SMART-only property for Standard", () => {
    const sections: PublicSpecificationSection[] = [
      {
        id: "smart",
        title: "NOIR SMART",
        sortOrder: 1,
        items: [
          {
            id: "reservoir",
            variantId: "smart-m",
            code: "reservoir",
            label: "SMART-резервуар",
            value: "900",
            unit: "мл",
            sortOrder: 0,
          },
        ],
      },
    ];

    expect(resolveSpecifications(sections, "standard-m")).toEqual([]);
    expect(resolveSpecifications(sections, "smart-m")).toHaveLength(1);
  });
});
