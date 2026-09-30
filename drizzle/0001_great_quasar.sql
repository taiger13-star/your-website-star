CREATE TABLE "project_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" varchar(160) NOT NULL,
	"company" varchar(200),
	"phone" varchar(60) NOT NULL,
	"email" varchar(254) NOT NULL,
	"project_details" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
