import { describe, expect, it } from "vitest";
import { reviewedSmartCopy, smartImageNotice } from "./smart-media";
import { productSchema } from "./seo";
import type { PublicProduct } from "@/server/catalog-service";

describe("current SMART versus archived media", () => {
  it("marks only reviewed old media, including the deployed hashed URL", () => {
    expect(smartImageNotice("http://localhost/smart-01.jpg")).toContain("Архивная");
    expect(
      smartImageNotice(
        "https://noir-atelier.ru/storage/noir-catalog/uploads/2026-09-30/2a784773-efea-4aef-af02-70dd1ef9edf8.jpg",
      ),
    ).toContain("Архивная");
    expect(smartImageNotice("http://localhost/uuid.jpg", "smart-03.jpg")).toContain("Архивная");
    expect(smartImageNotice("https://noir-atelier.ru/current-top-float.jpg")).toBeNull();
  });
  it("corrects exact legacy claims but preserves newly edited copy and other products", () => {
    const old = {
      slug: "noir-essential-05",
      shortDescription: "Кашпо с автополивом и прозрачным окном уровня воды.",
      description: "New verified description",
    };
    expect(reviewedSmartCopy(old).shortDescription).toContain("верхним");
    expect(reviewedSmartCopy(old).description).toBe(old.description);
    expect(reviewedSmartCopy({ ...old, slug: "another-model" }).shortDescription).toBe(
      old.shortDescription,
    );
    expect(
      reviewedSmartCopy({ ...old, shortDescription: "New verified short copy" }).shortDescription,
    ).toBe("New verified short copy");
  });
  it("does not advertise the archived side-window photo in Product image data", () => {
    const old = "https://noir-atelier.ru/old.jpg";
    const current = "https://noir-atelier.ru/current.jpg";
    const product = {
      slug: "test",
      sku: "test",
      name: "test",
      description: "test",
      images: [old, current],
      imageNotes: { [old]: "Архивная визуализация" },
      materials: [],
    } as unknown as PublicProduct;
    expect(productSchema(product, { price: 5000 } as never).image).toEqual([current]);
    expect(
      productSchema({ ...product, searchImages: [] }, { price: 5000 } as never),
    ).not.toHaveProperty("image");
  });
});
