ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_size_code_sizes_code_fk";
--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "size_label" varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "size_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "product_variants" AS variant
SET "size_label" = variant."size_code",
    "size_order" = COALESCE("sizes"."sort_order", 0)
FROM "sizes"
WHERE "sizes"."code" = variant."size_code";
