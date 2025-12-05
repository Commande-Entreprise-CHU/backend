import { Request, Response } from "express";
import { db } from "../db";
import {
  patients,
  patientConsultations,
  consultationTypes,
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
    const { name, sexe, ipp, q } = req.query;

    const conditions = [];

    if (q && typeof q === "string" && q.trim()) {
      const search = `%${q.toLowerCase().trim()}%`;
      conditions.push(
        or(
          ilike(patients.name, search),
          ilike(patients.prenom, search),
          ilike(patients.ipp, search),
          ilike(patients.sexe, search)
        )
      );
    } else {
      if (name && typeof name === "string" && name.trim()) {
        conditions.push(
          or(
            ilike(patients.name, `%${name.trim()}%`),
            ilike(patients.prenom, `%${name.trim()}%`)
          )
        );
      }
      if (sexe && typeof sexe === "string" && sexe.trim()) {
        conditions.push(eq(patients.sexe, sexe.trim()));
      }
      if (ipp && typeof ipp === "string" && ipp.trim()) {
        conditions.push(ilike(patients.ipp, `%${ipp.trim()}%`));
      }
    }

    if (conditions.length === 0) {
      // If no filters, return all (or maybe limit?)
      // For now, let's return all as per original behavior if q was empty
      const allPatients = await db.select().from(patients);
      res.json(allPatients);
      return;
    }

    const filtered = await db
      .select()
      .from(patients)
      .where(and(...conditions));

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
  });

  if (!patient) return null;

  // Fetch dynamic consultations
  const consultations = await db.query.patientConsultations.findMany({
    where: eq(patientConsultations.patientId, id),
    with: {
      type: true,
    },
  });

  const consultationsMap: Record<string, any> = {};

  consultations.forEach((c) => {
    consultationsMap[c.type.slug] = c.data;
  });

  return {
    ...patient,
    consultations: consultationsMap,
  };
};

export const updatePatientSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { values, consultationTypeId } = req.body;

    // Validation générique pour accepter tout objet JSON
    if (!values || typeof values !== "object") {
      return res.status(400).json({
        success: false,
        message: "Données invalides.",
      });
    }

    if (!consultationTypeId) {
      return res.status(400).json({
        success: false,
        message: "ID du type de consultation manquant.",
      });
    }

    await db
      .insert(patientConsultations)
      .values({
        patientId: id,
        consultationTypeId,
        data: values,
      })
      .onConflictDoUpdate({
        target: [
          patientConsultations.patientId,
          patientConsultations.consultationTypeId,
        ],
        set: {
          data: values,
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
