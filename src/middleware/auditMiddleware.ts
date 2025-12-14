import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { logAudit } from "../utils/audit";

export const auditMiddleware = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body) {
      let userId = req.user ? req.user.id : null;
      const resource = req.originalUrl;
      const status = res.statusCode >= 400 ? "FAILURE" : "SUCCESS";

      if (
        !userId &&
        (action === "LOGIN" || action === "REGISTER") &&
        status === "SUCCESS"
      ) {
        try {
          const data = typeof body === "string" ? JSON.parse(body) : body;
          if (data.user && data.user.id) {
            userId = data.user.id;
          }
        } catch (e) {
        }
      }

      const sanitizeData = (data: any): any => {
        if (!data) return null;
        if (typeof data !== "object") return data;

        if (Array.isArray(data)) {
          return data.map(sanitizeData);
        }

        // List of keys that MUST NOT appear in cleartext logs (HDS)
        const SENSITIVE_KEYS = [
          "password",
          "token",
          "access_token",
          "name",
          "prenom",
          "ipp",
          "dob",
          "sexe",
          "ssn",
          "email"
        ];

        const sanitized = { ...data };
        
        for (const key of Object.keys(sanitized)) {
          if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
            sanitized[key] = "***";
          } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
            sanitized[key] = sanitizeData(sanitized[key]);
          }
        }
        return sanitized;
      };

      logAudit(
        userId,
        action,
        resource,
        {
          method: req.method,
          ip: req.ip,
          statusCode: res.statusCode,
          query: sanitizeData(req.query),
          params: sanitizeData(req.params),
          body: sanitizeData(req.body),
        },
        status
      ).catch((err) => console.error("Audit Log Error:", err));

      return originalSend.call(this, body);
    };

    next();
  };
};
