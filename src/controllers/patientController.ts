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

    // HDS: Fetch all and filter in memory because fields are encrypted with random IV
    const allPatients = await db.query.patients.findMany();

    const existing = allPatients.find(
      (p) =>
        p.name.toLowerCase() === patientData.name.toLowerCase() &&
        p.prenom.toLowerCase() === patientData.prenom.toLowerCase() &&
        p.dob === patientData.dob
    );

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

    // HDS: Fetch all and filter in memory because fields are encrypted
    const allPatients = await db.query.patients.findMany();

    const filteredPatients = allPatients.filter((p) => {
      if (q && typeof q === "string" && q.trim()) {
        const search = q.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(search) ||
          p.prenom.toLowerCase().includes(search) ||
          (p.ipp && p.ipp.toLowerCase().includes(search)) ||
          p.sexe.toLowerCase().includes(search)
        );
      }

      let match = true;
      if (name && typeof name === "string" && name.trim()) {
        const search = name.toLowerCase().trim();
        match =
          match &&
          (p.name.toLowerCase().includes(search) ||
            p.prenom.toLowerCase().includes(search));
      }
      if (sexe && typeof sexe === "string" && sexe.trim()) {
        match = match && p.sexe === sexe.trim();
      }
      if (ipp && typeof ipp === "string" && ipp.trim()) {
        match =
          match &&
          (p.ipp
            ? p.ipp.toLowerCase().includes(ipp.toLowerCase().trim())
            : false);
      }
      return match;
    });

    res.json(filteredPatients);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche.",
    });
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
