import { Response } from "express";
import { db } from "../db";
import {
  patients,
  patientConsultations,
  consultationTypes,
} from "../db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { patientSchema } from "../validation/patientSchema";
import { AuthRequest } from "../middleware/authMiddleware";

// Helper to check if user is a super admin (master_admin without CHU restriction)
const isSuperAdmin = (user: AuthRequest["user"]): boolean => {
  return user?.role === "master_admin" && !user.chuId;
};

export const createPatient = async (req: AuthRequest, res: Response) => {
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
    const user = req.user;
    const chuId = user?.chuId;

    // HDS: Fetch all and filter in memory because fields are encrypted with random IV
    // Super Admin (master_admin without CHU) can see all patients
    const whereClause = isSuperAdmin(user)
      ? undefined
      : eq(patients.chuId, chuId as string);

    const allPatients = await db.query.patients.findMany({
      where: whereClause,
    });

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
        chuId: chuId ?? null,
        createdBy: user!.id,
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

export const searchPatients = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sexe, ipp, q } = req.query;
    const user = req.user;
    const chuId = user?.chuId;

    // HDS: Fetch all and filter in memory because fields are encrypted
    // Super Admin can see all patients, others only their CHU's patients
    const whereClause = isSuperAdmin(user)
      ? eq(patients.deleted, false)
      : and(eq(patients.chuId, chuId as string), eq(patients.deleted, false));

    const allPatients = await db.query.patients.findMany({
      where: whereClause,
    });

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

export const getPatientById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const chuId = user?.chuId;
    const patient = await getPatientData(id);

    if (!patient) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    // Super Admin can access any patient, others only their CHU's patients
    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching patient" });
  }
};

const getPatientData = async (id: string) => {
  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.deleted, false)),
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

export const updatePatientSection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { values, consultationTypeId } = req.body;
    const user = req.user;
    const chuId = user?.chuId;

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Super Admin can update any patient, others only their CHU's patients
    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Access denied" });
    }

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
        updatedBy: user?.id,
      })
      .onConflictDoUpdate({
        target: [
          patientConsultations.patientId,
          patientConsultations.consultationTypeId,
        ],
        set: {
          data: values,
          updatedAt: new Date(),
          updatedBy: user?.id,
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

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const chuId = user?.chuId;

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Super Admin can delete any patient, others only their CHU's patients
    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await db
      .update(patients)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(patients.id, id));

    res.json({ success: true, message: "Patient archivé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression.",
    });
  }
};

export const updatePatientCore = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, prenom, ipp, dob, sexe } = req.body;
    const user = req.user;
    const chuId = user?.chuId;

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Super Admin can update any patient, others only their CHU's patients
    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Basic validation
    if (!name || !prenom || !dob || !sexe) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants.",
      });
    }

    // Check for duplicates (excluding current patient)
    // HDS: Fetch all and filter in memory because fields are encrypted
    const whereClause = isSuperAdmin(user)
      ? eq(patients.deleted, false)
      : and(eq(patients.chuId, chuId as string), eq(patients.deleted, false));

    const allPatients = await db.query.patients.findMany({
      where: whereClause,
    });

    const duplicate = allPatients.find(
      (p) =>
        p.id !== id &&
        p.name.toLowerCase() === name.toLowerCase() &&
        p.prenom.toLowerCase() === prenom.toLowerCase() &&
        p.dob === dob
    );

    if (duplicate) {
      return res.json({
        success: false,
        message: "Un autre patient existe déjà avec ces informations.",
      });
    }

    const updatedPatient = await db
      .update(patients)
      .set({
        name,
        prenom,
        ipp: ipp || null,
        dob,
        sexe,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id))
      .returning();

    res.json({ success: true, patient: updatedPatient[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour.",
    });
  }
};
