import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// User roles in the system
export type UserRole = "master_admin" | "chu_admin" | "doctor";

// JWT payload type
export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  nom: string;
  prenom: string;
  chuId?: string | null;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be configured");
  }
  return secret;
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: {
  id: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
  chuId?: string | null;
}) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      chuId: user.chuId,
    },
    getJwtSecret(),
    {
      expiresIn: "24h",
    }
  );
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, getJwtSecret()) as UserPayload;
};

