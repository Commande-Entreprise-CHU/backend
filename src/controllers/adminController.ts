import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const uuidSchema = z.string().uuid("ID utilisateur invalide");

export const getUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        nom: users.nom,
        prenom: users.prenom,
        role: users.role,
        isActive: users.isActive,
        chuId: users.chuId,
        createdAt: users.createdAt,
      })
      .from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // HDS: Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive doit être un booléen" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        isActive: users.isActive,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const updateUserChu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chuId } = req.body;

    // HDS: Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ chuId })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        chuId: users.chuId,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user CHU:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
