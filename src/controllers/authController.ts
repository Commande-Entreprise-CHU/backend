import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

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

    res.json({
      success: true,
      token,
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

export const register = async (req: Request, res: Response) => {
  const { email, password, nom, prenom, chuId } = req.body;

  if (!email || !password || !nom || !prenom || !chuId) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont requis" });
  }

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
      role: "user",
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
