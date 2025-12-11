CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"action" varchar(50) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"details" jsonb,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
