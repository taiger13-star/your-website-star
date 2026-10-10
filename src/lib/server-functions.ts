/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().regex(/^[A-Za-z]{32}$/) });
const measurementValue = z.number().int().positive().nullable().optional();
const measurementsSchema = z.object({
  outerWidthMm: measurementValue,
  outerDepthMm: measurementValue,
  outerDiameterMm: measurementValue,
  outerHeightMm: measurementValue,
  innerWidthMm: measurementValue,
  innerDepthMm: measurementValue,
  innerDiameterMm: measurementValue,
  innerHeightMm: measurementValue,
  plantingVolumeMl: measurementValue,
  reservoirVolumeMl: measurementValue,
  weightGrams: measurementValue,
  scaleReference: z.enum(["plant", "person", "interior", "none"]).optional(),
});
const packageValue = z.number().int().positive().nullable().optional();
const variantSchema = z.object({
  sizeCode: z.string().min(1),
  system: z.enum(["standard", "smart"]),
  price: z.number().int().nonnegative(),
  productionDays: z.number().int().min(0).max(3650),
  enabled: z.boolean(),
  packageLengthCm: packageValue,
  packageWidthCm: packageValue,
  packageHeightCm: packageValue,
  packageWeightGrams: packageValue,
  measurements: measurementsSchema,
});
const specificationSchema = z.object({
  sectionTitle: z.string().trim().min(1).max(120),
  sectionOrder: z.number().int().min(0).max(100),
  code: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(2000),
  unit: z.string().trim().max(32).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100),
  variantKey: z
    .string()
    .regex(/^[^:]+:(standard|smart)$/)
    .nullable()
    .optional(),
});
const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  sku: z.string().min(1),
  collectionId: z.string().uuid().nullable(),
  category: z.string().min(1),
  form: z.string(),
  name: z.string().min(1),
  shortDescription: z.string(),
  description: z.string(),
  publicationStatus: z.enum(["draft", "published", "hidden"]),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
  isComingSoon: z.boolean(),
  featured: z.boolean(),
  colorIds: z.array(z.string()),
  materialNames: z.array(z.string()),
  mediaIds: z.array(z.string().uuid()),
  variants: z.array(variantSchema).min(1),
  specifications: z.array(specificationSchema).max(80),
});
const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  coverMediaId: z.string().uuid().nullable(),
});
const refSchema = z.object({
  type: z.enum(["size", "color", "material"]),
  id: z.string().optional(),
  label: z.string().min(1),
  hex: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const getCatalogFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicCatalog } = await import("../server/catalog-service");
  return getPublicCatalog();
});

export const createOrderFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerName: z.string().min(2).max(160),
      phone: z.string().min(5).max(60),
      email: z.string().email().optional().or(z.literal("")),
      delivery: z.object({
        method: z.enum(["cdek_pvz", "cdek_courier"]),
        cityCode: z.number().int().positive(),
        pickupPointCode: z.string().trim().min(1).max(120).optional(),
        deliveryAddress: z.string().trim().min(5).max(1000).optional(),
      }),
      comment: z.string().max(2000).optional(),
      items: z
        .array(
          z.object({
            productId: z.string().uuid(),
            variantId: z.string().uuid(),
            colorId: z.string().min(1),
            quantity: z.number().int().min(1).max(99),
          }),
        )
        .min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { createOrder } = await import("../server/order-service");
    return createOrder(data);
  });

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const findCdekCitiesFn = createServerFn({ method: "GET" })
  .validator(z.object({ query: z.string().trim().min(2).max(120) }))
  .handler(async ({ data }) => {
    const { findCdekCities } = await import("../server/cdek-service");
    return findCdekCities(data.query);
  });

export const findCdekPickupPointsFn = createServerFn({ method: "GET" })
  .validator(z.object({ cityCode: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const { findCdekPickupPoints } = await import("../server/cdek-service");
    return findCdekPickupPoints(data.cityCode);
  });

export const calculateCdekDeliveryFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      method: z.enum(["cdek_pvz", "cdek_courier"]),
      cityCode: z.number().int().positive(),
      pickupPointCode: z.string().trim().min(1).max(120).optional(),
      deliveryAddress: z.string().trim().min(5).max(1000).optional(),
      items: z.array(checkoutItemSchema).min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { calculateCdekDelivery } = await import("../server/cdek-service");
    return calculateCdekDelivery(data);
  });

export const createProjectInquiryFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      contactName: z.string().trim().min(2).max(160),
      company: z.string().trim().max(200).optional(),
      phone: z.string().trim().min(5).max(60),
      email: z.string().trim().email().max(254),
      projectDetails: z.string().trim().min(10).max(5000),
    }),
  )
  .handler(async ({ data }) => {
    const { createProjectInquiry } = await import("../server/project-inquiry-service");
    return createProjectInquiry(data);
  });

export const getAdminStateFn = createServerFn({ method: "POST" })
  .validator(tokenSchema)
  .handler(async ({ data }) => {
    const { isValidAdminRoute, requireAdmin } = await import("../server/auth");
    if (!isValidAdminRoute(data.token))
      return { validRoute: false, authenticated: false, data: null };
    try {
      requireAdmin();
      const { getAdminSnapshot } = await import("../server/admin-service");
      return getAdminSnapshot().then((snapshot) => ({
        validRoute: true,
        authenticated: true,
        data: snapshot,
      }));
    } catch {
      return { validRoute: true, authenticated: false, data: null };
    }
  });

export const loginAdminFn = createServerFn({ method: "POST" })
  .validator(tokenSchema.extend({ password: z.string().min(1).max(500) }))
  .handler(async ({ data }) => {
    const { isValidAdminRoute, startAdminSession, verifyAdminPassword } =
      await import("../server/auth");
    if (!isValidAdminRoute(data.token) || !verifyAdminPassword(data.password))
      throw new Error("Неверный пароль.");
    startAdminSession();
    return { ok: true };
  });

export const logoutAdminFn = createServerFn({ method: "POST" }).handler(async () => {
  const { endAdminSession } = await import("../server/auth");
  endAdminSession();
  return { ok: true };
});

export const saveProductFn = createServerFn({ method: "POST" })
  .validator(productSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { saveProduct } = await import("../server/admin-service");
    return saveProduct(data);
  });
export const deleteProductFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { deleteProduct } = await import("../server/admin-service");
    return deleteProduct(data.id);
  });
export const saveCollectionFn = createServerFn({ method: "POST" })
  .validator(collectionSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { saveCollection } = await import("../server/admin-service");
    return saveCollection(data);
  });
export const deleteCollectionFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { deleteCollection } = await import("../server/admin-service");
    return deleteCollection(data.id);
  });
export const saveReferenceFn = createServerFn({ method: "POST" })
  .validator(refSchema)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { saveReference } = await import("../server/admin-service");
    return saveReference(data);
  });
export const deleteReferenceFn = createServerFn({ method: "POST" })
  .validator(z.object({ type: z.enum(["size", "color", "material"]), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { deleteReference } = await import("../server/admin-service");
    return deleteReference(data);
  });
export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum([
        "new",
        "in_progress",
        "awaiting_customer",
        "ready",
        "completed",
        "cancelled",
      ]),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { updateOrderStatus } = await import("../server/admin-service");
    return updateOrderStatus(data.id, data.status);
  });
export const uploadMediaFn = createServerFn({ method: "POST" })
  .validator(z.custom<FormData>((value) => value instanceof FormData, "Expected form data"))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Выберите файл.");
    const { uploadMedia } = await import("../server/admin-service");
    return uploadMedia(file);
  });
export const deleteMediaFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("../server/auth");
    requireAdmin();
    const { deleteMedia } = await import("../server/admin-service");
    return deleteMedia(data.id);
  });
