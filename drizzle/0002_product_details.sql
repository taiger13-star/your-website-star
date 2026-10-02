CREATE TABLE "product_variant_measurements" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"outer_width_mm" integer,
	"outer_depth_mm" integer,
	"outer_diameter_mm" integer,
	"outer_height_mm" integer,
	"inner_width_mm" integer,
	"inner_depth_mm" integer,
	"inner_diameter_mm" integer,
	"inner_height_mm" integer,
	"planting_volume_ml" integer,
	"reservoir_volume_ml" integer,
	"weight_grams" integer,
	"scale_reference" varchar(24) DEFAULT 'plant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_specification_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"variant_id" uuid,
	"code" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"value" text NOT NULL,
	"unit" varchar(32),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variant_measurements" ADD CONSTRAINT "product_variant_measurements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_specification_sections" ADD CONSTRAINT "product_specification_sections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_section_id_product_specification_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."product_specification_sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
UPDATE "products" SET
  "slug" = 'noir-essential-05',
  "sku" = 'NA-ESSENTIAL-05',
  "name" = 'NOIR ESSENTIAL 05',
  "category" = 'planters',
  "collection_id" = (SELECT "id" FROM "collections" WHERE "slug" = 'essential')
WHERE "slug" = 'noir-smart-01';
--> statement-breakpoint
UPDATE "products" SET
  "slug" = 'noir-essential-06',
  "sku" = 'NA-ESSENTIAL-06',
  "name" = 'NOIR ESSENTIAL 06',
  "category" = 'planters',
  "collection_id" = (SELECT "id" FROM "collections" WHERE "slug" = 'essential')
WHERE "slug" = 'noir-smart-02';
--> statement-breakpoint
UPDATE "products" SET
  "slug" = 'noir-essential-07',
  "sku" = 'NA-ESSENTIAL-07',
  "name" = 'NOIR ESSENTIAL 07',
  "category" = 'planters',
  "collection_id" = (SELECT "id" FROM "collections" WHERE "slug" = 'essential')
WHERE "slug" = 'noir-smart-03';
--> statement-breakpoint
DELETE FROM "collections" WHERE "slug" = 'smart';
