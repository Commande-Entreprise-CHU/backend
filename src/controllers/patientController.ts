import { Request, Response } from "express";
import { db } from "../db";
import { patients, preConsultations, preOpConsultations, postOp3Consultations, postOp6Consultations } from "../db/schema";
import { eq, and, ilike, or } from "drizzle-orm";

export const createPatient = async (req: Request, res: Response) => {
  try {
    const form = req.body;

    // 1. Check for duplicates
    const existing = await db.query.patients.findFirst({
      where: and(
        ilike(patients.name, form.name),
        ilike(patients.prenom, form.prenom),
        eq(patients.dob, form.dob)
      ),
    });

    if (existing) {
      res.json({
        success: false,
        duplicate: true,
        patient: existing,
        message: "Le patient existe déjà.",
      });
      return;
    }

    // 2. Create new patient and preConsult in a transaction
    const result = await db.transaction(async (tx) => {
      const [newPatient] = await tx.insert(patients).values({
        name: form.name,
        prenom: form.prenom,
        ipp: form.ipp || null,
        dob: form.dob,
        sexe: form.sexe,
      }).returning();

      // Create empty or initial records for consultations if needed, 
      // or just the preConsult which seems to be part of the creation form
      if (form) {
        await tx.insert(preConsultations).values({
          patientId: newPatient.id,
          data: form,
        });
      }

      return newPatient;
    });

    // Fetch the full patient object to return
    const fullPatient = await getPatientData(result.id);

    res.json({
      success: true,
      duplicate: false,
      patient: fullPatient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la sauvegarde.",
    });
  }
};

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || "").toLowerCase().trim();

    if (!q) {
      const allPatients = await db.select().from(patients);
      res.json(allPatients);
      return;
    }

    const filtered = await db.select().from(patients).where(
      or(
        ilike(patients.name, `%${q}%`),
        ilike(patients.prenom, `%${q}%`),
        ilike(patients.ipp, `%${q}%`),
        ilike(patients.sexe, `%${q}%`)
      )
    );

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching patients" });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patient = await getPatientData(id);

    if (!patient) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching patient" });
  }
};

// Helper to fetch and format patient data
const getPatientData = async (id: string) => {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, id),
    with: {
      preConsult: true,
      preOp: true,
      postOp3: true,
      postOp6: true,
    },
  });

  if (!patient) return null;

  // Flatten the structure for frontend compatibility
  return {
    ...patient,
    preConsult: patient.preConsult?.data || null,
    preOp: patient.preOp?.data || null,
    postOp3: patient.postOp3?.data || null,
    postOp6: patient.postOp6?.data || null,
  };
};

export const updatePatientSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { section, values } = req.body;

    if (!["preConsult", "preOp", "postOp3", "postOp6"].includes(section)) {
      res.status(400).json({
        success: false,
        message: "Section invalide",
      });
      return;
    }

    let table;
    switch (section) {
      case "preConsult": table = preConsultations; break;
      case "preOp": table = preOpConsultations; break;
      case "postOp3": table = postOp3Consultations; break;
      case "postOp6": table = postOp6Consultations; break;
      default: throw new Error("Invalid section");
    }

    // Upsert logic
    await db.insert(table)
      .values({
        patientId: id,
        data: values,
      })
      .onConflictDoUpdate({
        target: table.patientId,
        set: {
          data: values,
          updatedAt: new Date(),
        },
      });

    // Return the updated patient
    const updatedPatient = await getPatientData(id);

    res.json({ success: true, patient: updatedPatient });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Erreur interne",
    });
  }
};

// Specific update handlers
export const updatePreConsult = async (req: Request, res: Response) => {
  await updateSpecificSection(req, res, "preConsult");
};

export const updatePreOp = async (req: Request, res: Response) => {
  await updateSpecificSection(req, res, "preOp");
};

export const updatePostOp3 = async (req: Request, res: Response) => {
  await updateSpecificSection(req, res, "postOp3");
};

export const updatePostOp6 = async (req: Request, res: Response) => {
  await updateSpecificSection(req, res, "postOp6");
};

const updateSpecificSection = async (req: Request, res: Response, section: "preConsult" | "preOp" | "postOp3" | "postOp6") => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Reuse the logic from updatePatientSection but adapted
    let table;
    switch (section) {
      case "preConsult": table = preConsultations; break;
      case "preOp": table = preOpConsultations; break;
      case "postOp3": table = postOp3Consultations; break;
      case "postOp6": table = postOp6Consultations; break;
      default: throw new Error("Invalid section");
    }

    await db.insert(table)
      .values({
        patientId: id,
        data: data,
      })
      .onConflictDoUpdate({
        target: table.patientId,
        set: {
          data: data,
          updatedAt: new Date(),
        },
      });

    const updatedPatient = await getPatientData(id);
    if (!updatedPatient) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json({ success: true, data: updatedPatient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating section" });
  }
};
