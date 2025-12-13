import { Response } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../utils/auth";

const uuidSchema = z.string().uuid("ID utilisateur invalide");
const validRoles: UserRole[] = ["master_admin", "chu_admin", "doctor"];
const roleSchema = z.enum(["master_admin", "chu_admin", "doctor"]);

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = req.user;
    
    let query = db
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
    
    // CHU Admin can only see users from their CHU
    if (currentUser?.role === "chu_admin" && currentUser.chuId) {
      const allUsers = await query.where(eq(users.chuId, currentUser.chuId));
      return res.json(allUsers);
    }
    
    // Master Admin sees all users
    const allUsers = await query;
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const currentUser = req.user;

    // HDS: Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive doit être un booléen" });
    }

    // CHU Admin can only update users from their CHU
    if (currentUser?.role === "chu_admin") {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { chuId: true },
      });
      
      if (!targetUser || targetUser.chuId !== currentUser.chuId) {
        return res.status(403).json({ message: "Vous ne pouvez modifier que les utilisateurs de votre CHU" });
      }
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

export const updateUserChu = async (req: AuthRequest, res: Response) => {
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

// Admin: Update user role
// - Master Admin can assign any role to any user
// - CHU Admin can only assign 'doctor' role to users in their CHU
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    // HDS: Validate UUID format
    const idValidation = uuidSchema.safeParse(id);
    if (!idValidation.success) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    // Validate role
    const roleValidation = roleSchema.safeParse(role);
    if (!roleValidation.success) {
      return res.status(400).json({ 
        message: `Rôle invalide. Valeurs acceptées: ${validRoles.join(", ")}` 
      });
    }

    // CHU Admin restrictions
    if (currentUser?.role === "chu_admin") {
      // CHU Admin can only assign 'doctor' role
      if (role !== "doctor") {
        return res.status(403).json({ 
          message: "Vous ne pouvez assigner que le rôle 'Médecin'" 
        });
      }

      // CHU Admin can only modify users from their CHU
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { chuId: true },
      });
      
      if (!targetUser || targetUser.chuId !== currentUser.chuId) {
        return res.status(403).json({ 
          message: "Vous ne pouvez modifier que les utilisateurs de votre CHU" 
        });
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

