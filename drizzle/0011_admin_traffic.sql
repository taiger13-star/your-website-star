CREATE TABLE "site_page_views" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"visitor_id" uuid NOT NULL,
	"path" varchar(200) NOT NULL,
	"device" varchar(12) NOT NULL,
	"referrer_host" varchar(120) NOT NULL,
	"viewed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"first_seen" timestamp with time zone NOT NULL,
	"last_seen" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_page_views" ADD CONSTRAINT "site_page_views_session_id_site_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."site_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_page_views_viewed_idx" ON "site_page_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "site_page_views_session_idx" ON "site_page_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "site_sessions_last_seen_idx" ON "site_sessions" USING btree ("last_seen");