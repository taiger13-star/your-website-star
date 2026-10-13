import { beforeEach, describe, expect, it, vi } from "vitest";

import legalDocuments from "../content/legal-documents.json";
import { createProjectInquiry } from "./project-inquiry-service";

const dbMock = vi.hoisted(() => {
  const returning = vi.fn().mockResolvedValue([{ id: "inquiry-id" }]);
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  return { insert, values, returning };
});

vi.mock("./db", () => ({ getDb: () => ({ insert: dbMock.insert }) }));

const inquiry = {
  contactName: "Иван Иванов",
  company: "Студия",
  phone: "+79990000000",
  email: "ivan@example.test",
  projectDetails: "Проект оформления пространства",
};

describe("project inquiry consent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an inquiry without consent before writing to the database", async () => {
    await expect(createProjectInquiry({ ...inquiry, personalDataConsent: false })).rejects.toThrow(
      "Необходимо согласие",
    );
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("stores the consent time and the exact document text with the inquiry", async () => {
    await createProjectInquiry({ ...inquiry, personalDataConsent: true });

    expect(dbMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: inquiry.contactName,
        personalDataConsentAt: expect.any(Date),
        personalDataConsentText: legalDocuments.data.map((block) => block.text).join("\n\n"),
      }),
    );
  });
});
