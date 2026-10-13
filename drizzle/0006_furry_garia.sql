CREATE TYPE "public"."delivery_payment_mode" AS ENUM('prepaid', 'on_receipt');--> statement-breakpoint
CREATE TYPE "public"."order_payment_component" AS ENUM('product', 'delivery');--> statement-breakpoint
CREATE TYPE "public"."order_payment_status" AS ENUM('pending', 'mock_paid', 'awaiting_receipt', 'paid');--> statement-breakpoint
CREATE TABLE "order_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"component" "order_payment_component" NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'RUB' NOT NULL,
	"status" "order_payment_status" NOT NULL,
	"provider" varchar(40),
	"external_reference" varchar(160),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_key" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_payment_mode" "delivery_payment_mode";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_city_name" varchar(160);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_quote_is_test" boolean;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cdek_tracking_number" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "grand_total" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pay_now_total" integer;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_payments_order_component_unique" ON "order_payments" USING btree ("order_id","component");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_user_checkout_key_unique" ON "orders" USING btree ("user_id","checkout_key");