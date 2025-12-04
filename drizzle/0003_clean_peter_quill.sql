CREATE TABLE "consultation_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_type_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"structure" jsonb NOT NULL,
	"template" text NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consultation_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "consultation_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "consultation_templates" ADD CONSTRAINT "consultation_templates_consultation_type_id_consultation_types_id_fk" FOREIGN KEY ("consultation_type_id") REFERENCES "public"."consultation_types"("id") ON DELETE no action ON UPDATE no action;