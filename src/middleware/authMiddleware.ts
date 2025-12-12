import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { AUTH_COOKIE_NAME } from "../config/auth";

export interface AuthRequest extends Request {
  user?: any;
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

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};
