import { db } from "../db";
import { auditLogs } from "../db/schema";

export const logAudit = async (
  userId: string | null,
  action: string,
  resource: string,
  details: any = null,
  status: "SUCCESS" | "FAILURE" = "SUCCESS"
) => {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      resource,
      details,
      status,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
