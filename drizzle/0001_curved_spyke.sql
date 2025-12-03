CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "post_op_3_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "post_op_3_consultations_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "post_op_6_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "post_op_6_consultations_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "pre_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pre_consultations_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "pre_op_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pre_op_consultations_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
ALTER TABLE "post_op_3_consultations" ADD CONSTRAINT "post_op_3_consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_op_6_consultations" ADD CONSTRAINT "post_op_6_consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_consultations" ADD CONSTRAINT "pre_consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_op_consultations" ADD CONSTRAINT "pre_op_consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "pre_consult";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "pre_op";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "post_op_3";--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "post_op_6";