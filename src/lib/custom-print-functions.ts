import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CONTACT_PHONE_ERROR, normalizeContactPhone } from "./contact-phone";

const quoteSchema = z.object({
  materialId: z.string().uuid().optional(),
  estimatedGrams: z.number().int().min(20).max(20_000).optional(),
  quantity: z.number().int().min(1).max(1000),
});

const inquirySchema = quoteSchema.extend({
  contactName: z.string().trim().min(2).max(160),
  phone: z
    .string()
    .trim()
    .max(60)
    .transform((value, context) => {
      const phone = normalizeContactPhone(value);
      if (phone) return phone;
      context.addIssue({ code: z.ZodIssueCode.custom, message: CONTACT_PHONE_ERROR });
      return z.NEVER;
    }),
  email: z.string().trim().email().max(254),
  description: z.string().trim().min(10).max(5000),
  modelStatus: z.enum(["ready", "need-modeling", "unsure"]),
  color: z.string().trim().max(120).optional(),
  dimensions: z.string().trim().max(200).optional(),
  purpose: z.string().trim().max(120).optional(),
  desiredDate: z.string().trim().max(80).optional(),
  personalDataConsent: z.literal(true),
});

export const getCustomPrintOptionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicCustomPrintOptions } = await import("../server/custom-print-service");
  return getPublicCustomPrintOptions();
});

export const getCustomPrintQuoteFn = createServerFn({ method: "POST" })
  .validator(quoteSchema)
  .handler(async ({ data }) => {
    const { getCustomPrintQuote } = await import("../server/custom-print-service");
    return getCustomPrintQuote(data);
  });

export const createCustomPrintInquiryFn = createServerFn({ method: "POST" })
  .validator(z.custom<FormData>((value) => value instanceof FormData, "Expected form data"))
  .handler(async ({ data }) => {
    if (data.get("website")) return { id: "" };
    const value = (key: string) => String(data.get(key) ?? "");
    const parsed = inquirySchema.parse({
      contactName: value("contactName"),
      phone: value("phone"),
      email: value("email"),
      description: value("description"),
      modelStatus: value("modelStatus"),
      materialId: value("materialId") || undefined,
      color: value("color") || undefined,
      quantity: Number(value("quantity")),
      estimatedGrams: value("estimatedGrams") ? Number(value("estimatedGrams")) : undefined,
      dimensions: value("dimensions") || undefined,
      purpose: value("purpose") || undefined,
      desiredDate: value("desiredDate") || undefined,
      personalDataConsent: value("personalDataConsent") === "on",
    });
    const files = data
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);
    const { createCustomPrintInquiry } = await import("../server/custom-print-service");
    const { personalDataConsent: _consent, ...input } = parsed;
    void _consent;
    return createCustomPrintInquiry(input, files);
  });

const money = z.number().int().min(0).max(1_000_000);

export const getAdminCustomPrintStateFn = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("../server/auth");
  requireAdmin();
  const { getAdminCustomPrintState } = await import("../server/custom-print-service");
  return getAdminCustomPrintState();
});

export const saveCustomPrintSettingsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      estimatesEnabled: z.boolean(),
      machineRubHour: money,
      laborRubHour: money,
      gramsPerHour: z.number().int().min(1).max(1000),
      setupFeeRub: money,
      wastePercent: z.number().int().min(0).max(100),
      markupPercent: z.number().int().min(0).max(1000),
      minimumOrderRub: money,
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { saveCustomPrintSettings } = await import("../server/custom-print-service");
    return saveCustomPrintSettings(data);
  });

export const saveCustomPrintMaterialFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(1000),
      priceRubKg: money,
      active: z.boolean(),
      sortOrder: z.number().int().min(0).max(1000),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { saveCustomPrintMaterial } = await import("../server/custom-print-service");
    return saveCustomPrintMaterial(data);
  });

export const updateCustomPrintInquiryStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "in_progress", "answered", "closed"]),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { updateCustomPrintInquiryStatus } = await import("../server/custom-print-service");
    return updateCustomPrintInquiryStatus(data.id, data.status);
  });

export const downloadCustomPrintFileFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { downloadCustomPrintFile } = await import("../server/custom-print-service");
    return downloadCustomPrintFile(data.id);
  });
