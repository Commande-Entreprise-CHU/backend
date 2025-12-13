import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { AUTH_COOKIE_NAME } from "../config/auth";
import { registerSchema } from "../validation/authSchema";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants invalides" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Identifiants invalides" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Votre compte est en attente de validation par un administrateur.",
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role || "user",
      nom: user.nom,
      prenom: user.prenom,
      chuId: user.chuId,
    });

    const isProduction = process.env.APP_ENV === "production";
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        chuId: user.chuId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const isProduction = process.env.APP_ENV === "production";
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
  res.json({ success: true });
};

export const register = async (req: Request, res: Response) => {
  // HDS: Validate input with password policy
  const validationResult = registerSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errors = validationResult.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "Données invalides";
    return res.status(400).json({ 
      success: false, 
      message: firstError,
      errors,
    });
  }

  const { email, password, nom, prenom, chuId } = validationResult.data;

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      nom,
      prenom,
      chuId,
      isActive: false, // Default to false, requires admin approval
      role: "doctor",
    });

    res.json({
      success: true,
      message:
        "Compte créé avec succès. Veuillez attendre la validation par un administrateur.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const pendingUsers = await db.query.users.findMany({
      where: eq(users.isActive, false),
      columns: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        createdAt: true,
      },
    });
    res.json({ success: true, users: pendingUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    await db.update(users).set({ isActive: true }).where(eq(users.id, userId));

    res.json({ success: true, message: "Utilisateur approuvé" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getMe = async (req: any, res: Response) => {
  res.json({ success: true, user: req.user });
};
