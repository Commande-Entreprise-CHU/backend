import { Request, Response, NextFunction } from "express";
import { verifyToken, UserPayload, UserRole } from "../utils/auth";
import { AUTH_COOKIE_NAME } from "../config/auth";

// Re-export UserRole for external use
export { UserRole };

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.split(" ")[1];
  const cookieToken = (req as any).cookies?.[AUTH_COOKIE_NAME];
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    if (cookieToken) {
      res.clearCookie(AUTH_COOKIE_NAME);
    }
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Legacy middleware - kept for backwards compatibility
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && (req.user.role === "master_admin" || req.user.role === "chu_admin")) {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// Master Admin only - full system access
export const isMasterAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "master_admin") {
    next();
  } else {
    res.status(403).json({ message: "Master Admin access required" });
  }
};

// CHU Admin or Master Admin - for CHU-level management
export const isChuAdminOrMaster = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && (req.user.role === "master_admin" || req.user.role === "chu_admin")) {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// Flexible role checking middleware
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && allowedRoles.includes(req.user.role as UserRole)) {
      next();
    } else {
      res.status(403).json({ message: `Access denied. Required roles: ${allowedRoles.join(", ")}` });
    }
  };
};

