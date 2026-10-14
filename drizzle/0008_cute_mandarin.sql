CREATE TABLE "custom_print_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"object_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"byte_size" integer NOT NULL,
	"content_type" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_print_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" varchar(160) NOT NULL,
	"phone" varchar(60) NOT NULL,
	"email" varchar(254) NOT NULL,
	"description" text NOT NULL,
	"model_status" varchar(30) NOT NULL,
	"material_id" uuid,
	"material_name" varchar(120),
	"color" varchar(120),
	"quantity" integer NOT NULL,
	"estimated_grams" integer,
	"dimensions" varchar(200),
	"purpose" varchar(120),
	"desired_date" varchar(80),
	"quote_rub" integer,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"personal_data_consent_at" timestamp with time zone NOT NULL,
	"personal_data_consent_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_print_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_rub_kg" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_print_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"estimates_enabled" boolean DEFAULT false NOT NULL,
	"machine_rub_hour" integer DEFAULT 0 NOT NULL,
	"labor_rub_hour" integer DEFAULT 0 NOT NULL,
	"grams_per_hour" integer DEFAULT 20 NOT NULL,
	"setup_fee_rub" integer DEFAULT 0 NOT NULL,
	"waste_percent" integer DEFAULT 0 NOT NULL,
	"markup_percent" integer DEFAULT 0 NOT NULL,
	"minimum_order_rub" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_print_files" ADD CONSTRAINT "custom_print_files_inquiry_id_custom_print_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."custom_print_inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_print_inquiries" ADD CONSTRAINT "custom_print_inquiries_material_id_custom_print_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."custom_print_materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_print_inquiries_created_idx" ON "custom_print_inquiries" USING btree ("created_at");