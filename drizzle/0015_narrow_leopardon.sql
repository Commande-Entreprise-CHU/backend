ALTER TABLE "patient_consultations" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "patient_consultations" ADD CONSTRAINT "patient_consultations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;