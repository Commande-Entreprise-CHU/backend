import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  date,
  boolean,
  text,
  integer,
  unique,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/crypto";

const encryptedJson = customType<{ data: any; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value: any): string {
    return encrypt(value);
  },
  fromDriver(value: string): any {
    return decrypt(value);
  },
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  prenom: varchar("prenom", { length: 255 }).notNull(),
  ipp: varchar("ipp", { length: 50 }),
  dob: date("dob").notNull(),
  sexe: varchar("sexe", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const consultationTypes = pgTable("consultation_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const consultationTemplates = pgTable("consultation_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  consultationTypeId: uuid("consultation_type_id")
    .references(() => consultationTypes.id)
    .notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  structure: jsonb("structure").notNull(),
  template: text("template").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultationTypesRelations = relations(
  consultationTypes,
  ({ many }) => ({
    templates: many(consultationTemplates),
  })
);

export const consultationTemplatesRelations = relations(
  consultationTemplates,
  ({ one }) => ({
    type: one(consultationTypes, {
      fields: [consultationTemplates.consultationTypeId],
      references: [consultationTypes.id],
    }),
  })
);

// HDS: Audit Logs for traceability
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }), // Nullable if system action or unauthenticated (should be avoided)
  action: varchar("action", { length: 50 }).notNull(), // READ, WRITE, DELETE, LOGIN
  resource: varchar("resource", { length: 100 }).notNull(), // /api/patient/123
  details: jsonb("details"), // Metadata (IP, UserAgent, etc.) - NO SENSITIVE DATA
  status: varchar("status", { length: 20 }).notNull(), // SUCCESS, FAILURE
  createdAt: timestamp("created_at").defaultNow(),
});

export const patientConsultations = pgTable(
  "patient_consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .references(() => patients.id)
      .notNull(),
    consultationTypeId: uuid("consultation_type_id")
      .references(() => consultationTypes.id)
      .notNull(),
    data: encryptedJson("data"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.patientId, t.consultationTypeId),
  })
);

export const patientConsultationsRelations = relations(
  patientConsultations,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientConsultations.patientId],
      references: [patients.id],
    }),
    type: one(consultationTypes, {
      fields: [patientConsultations.consultationTypeId],
      references: [consultationTypes.id],
    }),
  })
);
