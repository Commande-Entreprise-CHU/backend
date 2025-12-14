import { Response } from "express";
import { db } from "../db";
import { hashForSearch } from "../utils/crypto";
import {
  patients,
  patientConsultations,
} from "../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { patientSchema } from "../validation/patientSchema";
import { AuthRequest } from "../middleware/authMiddleware";
import { isSuperAdmin } from "../utils/auth";

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
        nameDigest: hashForSearch(patientData.name),
        prenomDigest: hashForSearch(patientData.prenom),
        ippDigest: patientData.ipp ? hashForSearch(patientData.ipp) : null,
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

    const conditions = [
      isSuperAdmin(user) ? undefined : eq(patients.chuId, chuId as string),
      eq(patients.deleted, false),
    ];

    // Global search ("q") -> exact match on name, prenom, or ipp
    if (q && typeof q === "string" && q.trim()) {
      const searchHash = hashForSearch(q);
      conditions.push(
        or(
          eq(patients.nameDigest, searchHash),
          eq(patients.prenomDigest, searchHash),
          eq(patients.ippDigest, searchHash)
        )
      );
    } else {
      // Specific fields search
      if (name && typeof name === "string" && name.trim()) {
        const nameHash = hashForSearch(name);
        conditions.push(
          or(
            eq(patients.nameDigest, nameHash),
            eq(patients.prenomDigest, nameHash)
          )
        );
      }
      if (ipp && typeof ipp === "string" && ipp.trim()) {
        conditions.push(eq(patients.ippDigest, hashForSearch(ipp)));
      }
    }

    // Sexe filter (safe to do in DB as it is not encrypted)
    if (sexe && typeof sexe === "string" && sexe.trim()) {
      conditions.push(eq(patients.sexe, sexe.trim()));
    }

    const whereClause = and(
      ...conditions.filter((c) => c !== undefined)
    );

    const foundPatients = await db.query.patients.findMany({
      where: whereClause,
      limit: 50, // Limit results for performance
      orderBy: (patients, { desc }) => [desc(patients.updatedAt)],
    });
    
    // Client-side filtering for 'prenom' is NOT needed if we don't have a prenom field in the search form, 
    // but the current frontend form ONLY has Name, IPP, Sexe. 
    // If the user searches "Name" in the form, they might mean "Prenom" too if they are confused, 
    // but usually "Name" maps to "Name". 
    // Wait, the frontend form has "Name" (nom) input.
    // If I look at the old code:
    // (p.name.toLowerCase().includes(search) || p.prenom.toLowerCase().includes(search))
    // So "name" input was searching BOTH Name AND Prenom.
    // I should fix my query to match that.
    
    // REVISITING logic for "name" param:
    // If param 'name' is provided, we should check BOTH nameDigest and prenomDigest to mimic old behavior roughly, or just nameDigest. 
    // The old code: match = match && (name... || prenom...)
    // So yes, I should check both.
    
    // Wait, I can't restart this replacement block mid-stream. 
    // I will submit this version initially, but I will fix the logical mapping in a second replacement to be robust.
    // However, looking at the block above:
    // if (name ..) conditions.push(eq(patients.nameDigest ...))
    // This only checks Name. 
    
    // I will rewrite the replacement content to be correct right now.
   
    res.json(foundPatients);
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
      res.status(404).json({ message: "Patient non trouvé" });
      return;
    }

    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération du patient" });
  }
};

const getPatientData = async (id: string) => {
  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.deleted, false)),
  });

  if (!patient) return null;

  if (!patient) return null;
  
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
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

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
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Accès refusé" });
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
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    if (!isSuperAdmin(user) && patient.chuId !== chuId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!name || !prenom || !dob || !sexe) {
      return res.status(400).json({
        success: false,
        message: "Champs obligatoires manquants.",
      });
    }

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
        nameDigest: hashForSearch(name),
        prenomDigest: hashForSearch(prenom),
        ippDigest: ipp ? hashForSearch(ipp) : null,
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
