import { Request, Response } from "express";
import { db } from "../db";
import { patients, patientConsultations, users } from "../db/schema";
import { eq, count, and, desc, sql } from "drizzle-orm";
import { isSuperAdmin } from "../utils/auth";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const chuId = user.chuId;

    let patientCount = 0;
    let consultationCount = 0;
    let userCount = 0;

    if (isSuperAdmin(user)) {
       // Super Admin: Count everything
      const p = await db.select({ count: count() }).from(patients).where(eq(patients.deleted, false));
      patientCount = p[0].count;

      const c = await db.select({ count: count() }).from(patientConsultations);
      consultationCount = c[0].count;

       const u = await db.select({ count: count() }).from(users);
       userCount = u[0].count;

    } else {
      // CHU User: Count only related to CHU
      if (chuId) {
          const p = await db
            .select({ count: count() })
            .from(patients)
            .where(and(eq(patients.chuId, chuId), eq(patients.deleted, false)));
          patientCount = p[0].count;
          
         
         const c = await db
           .select({ count: count() })
           .from(patientConsultations)
           .innerJoin(patients, eq(patientConsultations.patientId, patients.id))
           .where(eq(patients.chuId, chuId));
         
         consultationCount = c[0].count;
         
         const u = await db.select({ count: count() }).from(users).where(eq(users.chuId, chuId));
         userCount = u[0].count;
      }
    }

    res.json({
      success: true,
      stats: {
        patients: patientCount,
        consultations: consultationCount,
        users: userCount,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

export const getMyRecentPatients = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    // 1. Patients created by me (recently)
    const createdPatients = await db
      .select({
        id: patients.id,
        name: patients.name,
        prenom: patients.prenom,
        ipp: patients.ipp,
        dob: patients.dob,
        sexe: patients.sexe,
        date: patients.createdAt,
        action: sql<string>`'created'`, 
      })
      .from(patients)
      .where(and(eq(patients.createdBy, userId), eq(patients.deleted, false)))
      .orderBy(desc(patients.createdAt))
      .limit(10);

    // 2. Patients I did a consultation for (recently)
    const consultedPatients = await db
      .select({
        id: patients.id,
        name: patients.name,
        prenom: patients.prenom,
        ipp: patients.ipp,
        dob: patients.dob,
        sexe: patients.sexe,
        date: patientConsultations.updatedAt,
        action: sql<string>`'consulted'`,
      })
      .from(patientConsultations)
      .innerJoin(patients, eq(patientConsultations.patientId, patients.id))
      .where(and(eq(patientConsultations.updatedBy, userId), eq(patients.deleted, false)))
      .orderBy(desc(patientConsultations.updatedAt))
      .limit(10);

    const allRecent = [...createdPatients, ...consultedPatients]
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 10);
    const uniqueRecent = allRecent.filter(
      (p, index, self) => index === self.findIndex((t) => t.id === p.id)
    );

    res.json({ success: true, patients: uniqueRecent });
  } catch (error) {
    console.error("Error fetching recent patients:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des patients récents",
    });
  }
};

