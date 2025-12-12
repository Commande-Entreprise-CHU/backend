import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { logAudit } from "../utils/audit";

export const auditMiddleware = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body) {
      // Capture userId at the moment of sending response
      let userId = req.user ? req.user.id : null;
      const resource = req.originalUrl;
      const status = res.statusCode >= 400 ? "FAILURE" : "SUCCESS";

      // Try to extract userId from response body for LOGIN/REGISTER actions
      if (
        !userId &&
        (action === "LOGIN" || action === "REGISTER") &&
        status === "SUCCESS"
      ) {
        try {
          // body might be a JSON string or an object
          const data = typeof body === "string" ? JSON.parse(body) : body;
          if (data.user && data.user.id) {
            userId = data.user.id;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      // Sanitize body to remove sensitive data
      const sanitizeBody = (data: any) => {
        if (!data) return null;
        if (typeof data !== "object") return data;
        const sanitized = { ...data };
        if ("password" in sanitized) sanitized.password = "***";
        return sanitized;
      };

      // Fire and forget audit log
      logAudit(
        userId,
        action,
        resource,
        {
          method: req.method,
          ip: req.ip,
          statusCode: res.statusCode,
          query: req.query,
          params: req.params,
          body: sanitizeBody(req.body),
        },
        status
      ).catch((err) => console.error("Audit Log Error:", err));

      return originalSend.call(this, body);
    };

    next();
  };
};
