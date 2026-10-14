import { and, desc, eq, gt } from "drizzle-orm";

import legalDocuments from "../content/legal-documents.json";
import { calculateMinimumPrintEstimate } from "@/lib/custom-print-pricing";
import { getDb } from "./db";
import {
  customPrintFiles,
  customPrintInquiries,
  customPrintMaterials,
  customPrintSettings,
} from "./schema";
import { readPrivateObject, removePrivateObject, uploadPrivateObject } from "./storage";

export const CUSTOM_PRINT_EXTENSIONS = [
  "stl",
  "obj",
  "3mf",
  "step",
  "stp",
  "iges",
  "igs",
  "zip",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;

export type PrintInquiryInput = {
  contactName: string;
  phone: string;
  email: string;
  description: string;
  modelStatus: "ready" | "need-modeling" | "unsure";
  materialId?: string | undefined;
  color?: string | undefined;
  quantity: number;
  estimatedGrams?: number | undefined;
  dimensions?: string | undefined;
  purpose?: string | undefined;
  desiredDate?: string | undefined;
};

async function activeMaterial(materialId?: string | undefined) {
  if (!materialId) return undefined;
  const [material] = await getDb()
    .select()
    .from(customPrintMaterials)
    .where(and(eq(customPrintMaterials.id, materialId), eq(customPrintMaterials.active, true)))
    .limit(1);
  return material;
}

export async function getPublicCustomPrintOptions() {
  const materials = await getDb()
    .select({
      id: customPrintMaterials.id,
      name: customPrintMaterials.name,
      description: customPrintMaterials.description,
    })
    .from(customPrintMaterials)
    .where(eq(customPrintMaterials.active, true))
    .orderBy(customPrintMaterials.sortOrder, customPrintMaterials.name);
  return { materials };
}

export async function getCustomPrintQuote(input: {
  materialId?: string | undefined;
  estimatedGrams?: number | undefined;
  quantity: number;
}) {
  if (!input.materialId || !input.estimatedGrams) return { price: null as number | null };
  const material = await activeMaterial(input.materialId);
  if (!material || material.priceRubKg <= 0) return { price: null as number | null };
  return {
    price: calculateMinimumPrintEstimate(material.priceRubKg, input.estimatedGrams, input.quantity),
  };
}

function checkedFiles(files: File[]) {
  if (files.length > 3) throw new Error("Можно приложить не более трёх файлов.");
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES)
    throw new Error("Общий размер файлов не должен превышать 40 МБ.");
  return files.map((file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!CUSTOM_PRINT_EXTENSIONS.includes(extension as (typeof CUSTOM_PRINT_EXTENSIONS)[number]))
      throw new Error(`Формат файла «${file.name}» не поддерживается.`);
    if (!file.size || file.size > MAX_FILE_BYTES)
      throw new Error("Размер каждого файла должен быть до 20 МБ.");
    return { file, extension };
  });
}

export async function createCustomPrintInquiry(input: PrintInquiryInput, files: File[]) {
  const preparedFiles = checkedFiles(files);
  if (
    input.modelStatus === "ready" &&
    !preparedFiles.some(({ extension }) =>
      ["stl", "obj", "3mf", "step", "stp", "iges", "igs"].includes(extension),
    )
  ) {
    throw new Error("Для печати по готовой модели необходимо приложить 3D-файл.");
  }
  const db = getDb();
  const recent = await db
    .select({ id: customPrintInquiries.id })
    .from(customPrintInquiries)
    .where(
      and(
        eq(customPrintInquiries.email, input.email.toLowerCase()),
        gt(customPrintInquiries.createdAt, new Date(Date.now() - 10 * 60_000)),
      ),
    );
  if (recent.length >= 3)
    throw new Error("Вы уже отправили несколько заявок. Попробуйте чуть позже.");

  const material = await activeMaterial(input.materialId);
  if (input.materialId && !material) throw new Error("Выбранный материал больше недоступен.");
  const uploaded: { objectKey: string; fileName: string; byteSize: number; contentType: string }[] =
    [];
  try {
    for (const { file, extension } of preparedFiles) {
      const objectKey = await uploadPrivateObject({
        body: new Uint8Array(await file.arrayBuffer()),
        extension,
        contentType: "application/octet-stream",
      });
      uploaded.push({
        objectKey,
        fileName: file.name
          .replace(/[\\/]/g, "_")
          .replace(/\p{Cc}/gu, "_")
          .slice(0, 255),
        byteSize: file.size,
        contentType: "application/octet-stream",
      });
    }
    const result = await db.transaction(async (tx) => {
      const [inquiry] = await tx
        .insert(customPrintInquiries)
        .values({
          ...input,
          email: input.email.toLowerCase(),
          materialId: material?.id ?? null,
          materialName: material?.name ?? null,
          color: input.color || null,
          estimatedGrams: input.estimatedGrams ?? null,
          dimensions: input.dimensions || null,
          purpose: input.purpose || null,
          desiredDate: input.desiredDate || null,
          personalDataConsentAt: new Date(),
          personalDataConsentText: legalDocuments.data.map((block) => block.text).join("\n\n"),
        })
        .returning({ id: customPrintInquiries.id });
      if (uploaded.length)
        await tx.insert(customPrintFiles).values(
          uploaded.map((item) => ({
            ...item,
            inquiryId: inquiry!.id,
          })),
        );
      return inquiry!;
    });
    return { id: result.id };
  } catch (error) {
    await Promise.allSettled(uploaded.map((item) => removePrivateObject(item.objectKey)));
    throw error;
  }
}

export async function getAdminCustomPrintState() {
  const db = getDb();
  const [settings, materials, inquiries, files] = await Promise.all([
    db
      .select()
      .from(customPrintSettings)
      .where(eq(customPrintSettings.id, 1))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(customPrintMaterials)
      .orderBy(customPrintMaterials.sortOrder, customPrintMaterials.name),
    db.select().from(customPrintInquiries).orderBy(desc(customPrintInquiries.createdAt)),
    db.select().from(customPrintFiles),
  ]);
  return {
    settings: settings ?? {
      estimatesEnabled: false,
      machineRubHour: 0,
      laborRubHour: 0,
      gramsPerHour: 20,
      setupFeeRub: 0,
      wastePercent: 0,
      markupPercent: 0,
      minimumOrderRub: 0,
    },
    materials,
    inquiries: inquiries.map((inquiry) => ({
      ...inquiry,
      files: files
        .filter((file) => file.inquiryId === inquiry.id)
        .map(({ id, fileName, byteSize }) => ({ id, fileName, byteSize })),
    })),
  };
}

export async function saveCustomPrintSettings(input: {
  estimatesEnabled: boolean;
  machineRubHour: number;
  laborRubHour: number;
  gramsPerHour: number;
  setupFeeRub: number;
  wastePercent: number;
  markupPercent: number;
  minimumOrderRub: number;
}) {
  const db = getDb();
  await db
    .insert(customPrintSettings)
    .values({ id: 1, ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: customPrintSettings.id,
      set: { ...input, updatedAt: new Date() },
    });
}

export async function saveCustomPrintMaterial(input: {
  id?: string | undefined;
  name: string;
  description: string;
  priceRubKg: number;
  active: boolean;
  sortOrder: number;
}) {
  const db = getDb();
  const values = {
    name: input.name.trim(),
    description: input.description.trim(),
    priceRubKg: input.priceRubKg,
    active: input.active,
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  };
  if (input.id) {
    const [updated] = await db
      .update(customPrintMaterials)
      .set(values)
      .where(eq(customPrintMaterials.id, input.id))
      .returning({ id: customPrintMaterials.id });
    if (!updated) throw new Error("Материал не найден.");
    return updated;
  }
  const [created] = await db
    .insert(customPrintMaterials)
    .values(values)
    .returning({ id: customPrintMaterials.id });
  return created!;
}

export async function updateCustomPrintInquiryStatus(id: string, status: string) {
  const [updated] = await getDb()
    .update(customPrintInquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(customPrintInquiries.id, id))
    .returning({ id: customPrintInquiries.id });
  if (!updated) throw new Error("Заявка не найдена.");
  return updated;
}

export async function downloadCustomPrintFile(id: string) {
  const [file] = await getDb()
    .select()
    .from(customPrintFiles)
    .where(eq(customPrintFiles.id, id))
    .limit(1);
  if (!file) throw new Error("Файл не найден.");
  const bytes = await readPrivateObject(file.objectKey);
  return { fileName: file.fileName, base64: Buffer.from(bytes).toString("base64") };
}
