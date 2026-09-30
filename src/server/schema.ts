import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const publicationStatus = pgEnum("publication_status", ["draft", "published", "hidden"]);
export const productSystem = pgEnum("product_system", ["standard", "smart"]);
export const orderStatus = pgEnum("order_status", [
  "new",
  "in_progress",
  "awaiting_customer",
  "ready",
  "completed",
  "cancelled",
]);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectKey: varchar("object_key", { length: 500 }).notNull(),
    publicUrl: text("public_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt,
  },
  (table) => [uniqueIndex("media_assets_object_key_unique").on(table.objectKey)],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    tagline: varchar("tagline", { length: 240 }).notNull(),
    description: text("description").notNull(),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("collections_slug_unique").on(table.slug)],
);

export const sizes = pgTable("sizes", {
  code: varchar("code", { length: 20 }).primaryKey(),
  label: varchar("label", { length: 80 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt,
  updatedAt,
});

export const colors = pgTable("colors", {
  id: varchar("id", { length: 80 }).primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  hex: varchar("hex", { length: 7 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt,
  updatedAt,
});

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("materials_name_unique").on(table.name)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 140 }).notNull(),
    sku: varchar("sku", { length: 120 }).notNull(),
    collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "set null" }),
    category: varchar("category", { length: 80 }).notNull(),
    form: varchar("form", { length: 160 }).notNull().default(""),
    name: varchar("name", { length: 180 }).notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    publicationStatus: publicationStatus("publication_status").notNull().default("draft"),
    isNew: boolean("is_new").notNull().default(false),
    isBestseller: boolean("is_bestseller").notNull().default(false),
    isComingSoon: boolean("is_coming_soon").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    releasedAt: timestamp("released_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    uniqueIndex("products_sku_unique").on(table.sku),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeCode: varchar("size_code", { length: 20 })
      .notNull()
      .references(() => sizes.code),
    system: productSystem("system").notNull().default("standard"),
    price: integer("price").notNull(),
    productionDays: integer("production_days").notNull().default(7),
    enabled: boolean("enabled").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("product_variants_variant_unique").on(
      table.productId,
      table.sizeCode,
      table.system,
    ),
  ],
);

export const productColors = pgTable(
  "product_colors",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: varchar("color_id", { length: 80 })
      .notNull()
      .references(() => colors.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.colorId] })],
);

export const productMaterials = pgTable(
  "product_materials",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.materialId] })],
);

export const productImages = pgTable(
  "product_images",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.productId, table.mediaId] })],
);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: integer("number").generatedAlwaysAsIdentity().notNull(),
  status: orderStatus("status").notNull().default("new"),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 60 }).notNull(),
  email: varchar("email", { length: 254 }),
  deliveryMethod: varchar("delivery_method", { length: 120 }).notNull(),
  deliveryAddress: text("delivery_address"),
  comment: text("comment"),
  total: integer("total").notNull(),
  createdAt,
  updatedAt,
});

export const projectInquiries = pgTable("project_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  contactName: varchar("contact_name", { length: 160 }).notNull(),
  company: varchar("company", { length: 200 }),
  phone: varchar("phone", { length: 60 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  projectDetails: text("project_details").notNull(),
  createdAt,
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 180 }).notNull(),
  sizeCode: varchar("size_code", { length: 20 }).notNull(),
  system: productSystem("system").notNull(),
  colorName: varchar("color_name", { length: 100 }).notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  snapshot: jsonb("snapshot").notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  collection: one(collections, { fields: [products.collectionId], references: [collections.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));
