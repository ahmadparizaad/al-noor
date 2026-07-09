CREATE TYPE "public"."device_type" AS ENUM('mobile', 'desktop', 'tablet');--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"destination" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scan_count" integer DEFAULT 0 NOT NULL,
	"qr_png_url" text NOT NULL,
	"qr_svg_url" text NOT NULL,
	"qr_color" text DEFAULT '#000000' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "qr_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"qr_code_id" text NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"device_type" "device_type",
	"browser" text,
	"os" text,
	"city" text,
	"country" text,
	"region" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"user_agent" text,
	"referrer" text
);
--> statement-breakpoint
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_qr_scans_qr_code_id" ON "qr_scans" USING btree ("qr_code_id");--> statement-breakpoint
CREATE INDEX "idx_qr_scans_scanned_at" ON "qr_scans" USING btree ("scanned_at");