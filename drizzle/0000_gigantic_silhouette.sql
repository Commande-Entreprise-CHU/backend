CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"prenom" varchar(255) NOT NULL,
	"ipp" varchar(50),
	"dob" varchar(20) NOT NULL,
	"sexe" varchar(20) NOT NULL,
	"pre_consult" jsonb,
	"pre_op" jsonb,
	"post_op_3" jsonb,
	"post_op_6" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
