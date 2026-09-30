import { getDb } from "./db";
import { projectInquiries } from "./schema";

export type ProjectInquiryInput = {
  contactName: string;
  company?: string;
  phone: string;
  email: string;
  projectDetails: string;
};

export async function createProjectInquiry(input: ProjectInquiryInput) {
  const [inquiry] = await getDb()
    .insert(projectInquiries)
    .values({
      contactName: input.contactName.trim(),
      company: input.company?.trim() || null,
      phone: input.phone.trim(),
      email: input.email.trim(),
      projectDetails: input.projectDetails.trim(),
    })
    .returning({ id: projectInquiries.id });
  return inquiry!;
}
