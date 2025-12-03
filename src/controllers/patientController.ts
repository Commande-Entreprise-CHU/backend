import { Request, Response } from "express";
import { db } from "../db";
import {
  patients,
  preConsultations,
  preOpConsultations,
  postOp3Consultations,
  postOp6Consultations,
} from "../db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { patientSchema } from "../validation/patientSchema";

export const createPatient = async (req: Request, res: Response) => {
  try {
    const validationResult = patientSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Données patient invalides.",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const patientData = validationResult.data;

    const existing = await db.query.patients.findFirst({
      where: and(
        ilike(patients.name, patientData.name),
        ilike(patients.prenom, patientData.prenom),
        eq(patients.dob, patientData.dob)
      ),
    });

    if (existing) {
      return res.json({
        success: false,
        duplicate: true,
        patient: existing,
        message: "Le patient existe déjà.",
      });
    }

    const [newPatient] = await db
      .insert(patients)
      .values({
        name: patientData.name,
        prenom: patientData.prenom,
        ipp: patientData.ipp || null,
        dob: patientData.dob,
        sexe: patientData.sexe,
      })
      .returning();

    res.json({
      success: true,
      duplicate: false,
      patient: newPatient,
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
    const q = ((req.query.q as string) || "").toLowerCase().trim();

    if (!q) {
      const allPatients = await db.select().from(patients);
      res.json(allPatients);
      return;
    }

    const filtered = await db
      .select()
      .from(patients)
      .where(
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
      return res.status(400).json({
        success: false,
        message: "Section invalide",
      });
    }

    // Validation générique pour accepter tout objet JSON
    if (!values || typeof values !== "object") {
      return res.status(400).json({
        success: false,
        message: "Données invalides.",
      });
    }

    const validatedValues = values;

    let table;
    switch (section) {
      case "preConsult":
        table = preConsultations;
        break;
      case "preOp":
        table = preOpConsultations;
        break;
      case "postOp3":
        table = postOp3Consultations;
        break;

      case "postOp6":
        table = postOp6Consultations;
        break;
      default:
        throw new Error("Invalid section");
    }

    await db
      .insert(table)
      .values({
        patientId: id,
        data: validatedValues,
      })
      .onConflictDoUpdate({
        target: table.patientId,
        set: {
          data: validatedValues,
          updatedAt: new Date(),
        },
      });

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

const updateSpecificSection = async (
  req: Request,
  res: Response,
  section: "preConsult" | "preOp" | "postOp3" | "postOp6"
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Validation générique pour accepter tout objet JSON
    if (!data || typeof data !== "object") {
      return res.status(400).json({
        message: "Données invalides.",
      });
    }

    const validatedData = data;

    let table;
    switch (section) {
      case "preConsult":
        table = preConsultations;
        break;
      case "preOp":
        table = preOpConsultations;
        break;
      case "postOp3":
        table = postOp3Consultations;
        break;
      case "postOp6":
        table = postOp6Consultations;
        break;
      default:
        throw new Error("Invalid section");
    }

    await db
      .insert(table)
      .values({
        patientId: id,
        data: validatedData,
      })
      .onConflictDoUpdate({
        target: table.patientId,
        set: {
          data: validatedData,
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
