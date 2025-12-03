import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  prenom: varchar("prenom", { length: 255 }).notNull(),
  ipp: varchar("ipp", { length: 50 }),
  dob: varchar("dob", { length: 20 }).notNull(),
  sexe: varchar("sexe", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientsRelations = relations(patients, ({ one }) => ({
  preConsult: one(preConsultations, {
    fields: [patients.id],
    references: [preConsultations.patientId],
  }),
  preOp: one(preOpConsultations, {
    fields: [patients.id],
    references: [preOpConsultations.patientId],
  }),
  postOp3: one(postOp3Consultations, {
    fields: [patients.id],
    references: [postOp3Consultations.patientId],
  }),
  postOp6: one(postOp6Consultations, {
    fields: [patients.id],
    references: [postOp6Consultations.patientId],
  }),
}));

export const preConsultations = pgTable("pre_consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull().unique(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const preConsultationsRelations = relations(preConsultations, ({ one }) => ({
  patient: one(patients, {
    fields: [preConsultations.patientId],
    references: [patients.id],
  }),
}));

export const preOpConsultations = pgTable("pre_op_consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull().unique(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const preOpConsultationsRelations = relations(preOpConsultations, ({ one }) => ({
  patient: one(patients, {
    fields: [preOpConsultations.patientId],
    references: [patients.id],
  }),
}));

export const postOp3Consultations = pgTable("post_op_3_consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull().unique(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postOp3ConsultationsRelations = relations(postOp3Consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [postOp3Consultations.patientId],
    references: [patients.id],
  }),
}));

export const postOp6Consultations = pgTable("post_op_6_consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull().unique(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postOp6ConsultationsRelations = relations(postOp6Consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [postOp6Consultations.patientId],
    references: [patients.id],
  }),
}));
