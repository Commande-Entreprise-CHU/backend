CREATE TABLE "chus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "chu_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "chu_id" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_chu_id_chus_id_fk" FOREIGN KEY ("chu_id") REFERENCES "public"."chus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_chu_id_chus_id_fk" FOREIGN KEY ("chu_id") REFERENCES "public"."chus"("id") ON DELETE no action ON UPDATE no action;