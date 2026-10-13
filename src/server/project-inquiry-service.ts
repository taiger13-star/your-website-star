import legalDocuments from "../content/legal-documents.json";
import { getDb } from "./db";
import { projectInquiries } from "./schema";

export type ProjectInquiryInput = {
  contactName: string;
  company?: string;
  phone: string;
  email: string;
  projectDetails: string;
  personalDataConsent: boolean;
};

export async function createProjectInquiry(input: ProjectInquiryInput) {
  if (input.personalDataConsent !== true) {
    throw new Error("Необходимо согласие на обработку персональных данных.");
  }

  const [inquiry] = await getDb()
    .insert(projectInquiries)
    .values({
      contactName: input.contactName.trim(),
      company: input.company?.trim() || null,
      phone: input.phone.trim(),
      email: input.email.trim(),
      projectDetails: input.projectDetails.trim(),
      personalDataConsentAt: new Date(),
      personalDataConsentText: legalDocuments.data.map((block) => block.text).join("\n\n"),
    })
    .returning({ id: projectInquiries.id });
  return inquiry!;
}
