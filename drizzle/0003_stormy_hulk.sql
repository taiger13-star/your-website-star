ALTER TABLE "orders" ADD COLUMN "cdek_city_code" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cdek_point_code" varchar(120);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cdek_point_address" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cdek_tariff_code" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cdek_tariff_name" varchar(200);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_cost" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_currency" varchar(8);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_period_min" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_period_max" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_calculated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "package_length_cm" integer;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "package_width_cm" integer;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "package_height_cm" integer;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "package_weight_grams" integer;
