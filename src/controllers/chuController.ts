import { Request, Response } from "express";
import { db } from "../db";
import { chus } from "../db/schema";
import { eq } from "drizzle-orm";

export const createChu = async (req: Request, res: Response) => {
  try {
    const { name, city } = req.body;
    if (!name || !city) {
      return res.status(400).json({ message: "Name and city are required" });
    }

    const [newChu] = await db.insert(chus).values({ name, city }).returning();
    res.status(201).json(newChu);
  } catch (error) {
    console.error("Error creating CHU:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChus = async (req: Request, res: Response) => {
  try {
    const allChus = await db.select().from(chus);
    res.json(allChus);
  } catch (error) {
    console.error("Error fetching CHUs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChuById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [chu] = await db.select().from(chus).where(eq(chus.id, id));
    
    if (!chu) {
      return res.status(404).json({ message: "CHU not found" });
    }
    
    res.json(chu);
  } catch (error) {
    console.error("Error fetching CHU:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateChu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, city } = req.body;
    
    const [updatedChu] = await db
      .update(chus)
      .set({ name, city })
      .where(eq(chus.id, id))
      .returning();

    if (!updatedChu) {
      return res.status(404).json({ message: "CHU not found" });
    }

    res.json(updatedChu);
  } catch (error) {
    console.error("Error updating CHU:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.delete(chus).where(eq(chus.id, id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting CHU:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
