import { Request, Response } from "express";
import { db } from "../db";
import { auditLogs, users } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export const getAuditLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        status: auditLogs.status,
        createdAt: auditLogs.createdAt,
        details: auditLogs.details,
        userEmail: users.email,
        userName: users.nom,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur lors de la récupération des logs",
      });
  }
};
