import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./db";
import { customPrintFiles, customPrintInquiries, customPrintMaterials } from "./schema";
import {
  createCustomPrintInquiry,
  downloadCustomPrintFile,
  getPublicCustomPrintOptions,
  getCustomPrintQuote,
} from "./custom-print-service";
import { removePrivateObject } from "./storage";

const databaseDescribe = process.env["RUN_DB_TESTS"] === "1" ? describe : describe.skip;

databaseDescribe("guest custom print inquiry", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    const db = getDb();
    for (const id of createdIds) {
      const files = await db
        .select()
        .from(customPrintFiles)
        .where(eq(customPrintFiles.inquiryId, id));
      await db.delete(customPrintInquiries).where(eq(customPrintInquiries.id, id));
      await Promise.all(files.map((file) => removePrivateObject(file.objectKey)));
    }
    await closeDb();
  });

  it("keeps material costs out of public options and stores a private model for admin retrieval", async () => {
    const options = await getPublicCustomPrintOptions();
    expect(options.materials.every((material) => !Object.hasOwn(material, "priceRubKg"))).toBe(
      true,
    );

    const [material] = await getDb()
      .insert(customPrintMaterials)
      .values({ name: `inquiry-${randomUUID()}`, priceRubKg: 1000, active: true, sortOrder: 0 })
      .returning({ id: customPrintMaterials.id });

    const content = "solid model\nendsolid model\n";
    const file = new File([content], "sample.stl", { type: "model/stl" });
    let result: Awaited<ReturnType<typeof createCustomPrintInquiry>>;
    try {
      result = await createCustomPrintInquiry(
        {
          contactName: "Тестовый клиент",
          phone: "+79990000000",
          email: `print-${randomUUID()}@example.test`,
          description: "Нужно напечатать небольшую тестовую деталь.",
          modelStatus: "ready",
          materialId: material!.id,
          estimatedGrams: 1000,
          quantity: 1,
        },
        [file],
      );
    } finally {
      await getDb().delete(customPrintMaterials).where(eq(customPrintMaterials.id, material!.id));
    }
    createdIds.push(result.id);

    const [inquiry] = await getDb()
      .select({ quoteRub: customPrintInquiries.quoteRub })
      .from(customPrintInquiries)
      .where(eq(customPrintInquiries.id, result.id));
    expect(inquiry?.quoteRub).toBeNull();

    const [stored] = await getDb()
      .select()
      .from(customPrintFiles)
      .where(eq(customPrintFiles.inquiryId, result.id));
    expect(stored?.fileName).toBe("sample.stl");
    const downloaded = await downloadCustomPrintFile(stored!.id);
    expect(Buffer.from(downloaded.base64, "base64").toString()).toBe(content);
  });

  it("shows a minimum estimate without internal pricing settings", async () => {
    const [material] = await getDb()
      .insert(customPrintMaterials)
      .values({ name: `estimate-${randomUUID()}`, priceRubKg: 1000, active: true, sortOrder: 0 })
      .returning({ id: customPrintMaterials.id });
    try {
      const quote = await getCustomPrintQuote({
        materialId: material!.id,
        estimatedGrams: 1000,
        quantity: 1,
      });
      expect(quote.price).toBe(1000);
    } finally {
      await getDb().delete(customPrintMaterials).where(eq(customPrintMaterials.id, material!.id));
    }
  });

  it("rejects unsupported file formats before saving a request", async () => {
    await expect(
      createCustomPrintInquiry(
        {
          contactName: "Тестовый клиент",
          phone: "+79990000000",
          email: `print-${randomUUID()}@example.test`,
          description: "Нужно напечатать небольшую тестовую деталь.",
          modelStatus: "ready",
          quantity: 1,
        },
        [new File(["bad"], "script.html")],
      ),
    ).rejects.toThrow("не поддерживается");
  });

  it("requires a 3D file for print requests but accepts a design brief without one", async () => {
    const base = {
      contactName: "Тестовый клиент",
      phone: "+79990000000",
      email: `design-${randomUUID()}@example.test`,
      description: "Нужно разработать корпус устройства по описанию.",
      quantity: 1,
    };
    await expect(createCustomPrintInquiry({ ...base, modelStatus: "ready" }, [])).rejects.toThrow(
      "3D-файл",
    );

    const result = await createCustomPrintInquiry({ ...base, modelStatus: "need-modeling" }, []);
    createdIds.push(result.id);
    const [stored] = await getDb()
      .select()
      .from(customPrintInquiries)
      .where(eq(customPrintInquiries.id, result.id));
    expect(stored?.modelStatus).toBe("need-modeling");
    expect(stored?.quoteRub).toBeNull();
  });
});
