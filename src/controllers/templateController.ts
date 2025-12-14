import { Request, Response } from "express";
import { db } from "../db";
import { consultationTypes, consultationTemplates } from "../db/schema";
import { eq, desc, and, asc } from "drizzle-orm";

export const getConsultationTypes = async (_req: Request, res: Response) => {
  try {
    const types = await db
      .select()
      .from(consultationTypes)
      .where(eq(consultationTypes.deleted, false))
      .orderBy(asc(consultationTypes.order));
    res.json(types);
  } catch (error) {
    console.error("Error fetching consultation types:", error);
    res
      .status(500)
      .json({ error: "Échec de la récupération des types de consultation" });
  }
};

export const createConsultationType = async (req: Request, res: Response) => {
  try {
    const { slug, name, order } = req.body;
    const [newType] = await db
      .insert(consultationTypes)
      .values({ slug, name, order: order || 0 })
      .returning();
    res.json(newType);
  } catch (error) {
    console.error("Error creating consultation type:", error);
    res
      .status(500)
      .json({ error: "Échec de la création du type de consultation" });
  }
};

export const updateConsultationType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { slug, name, order } = req.body;

    const [updatedType] = await db
      .update(consultationTypes)
      .set({ slug, name, order })
      .where(eq(consultationTypes.id, id))
      .returning();

    if (!updatedType) {
      return res.status(404).json({ error: "Type de consultation non trouvé" });
    }

    res.json(updatedType);
  } catch (error) {
    console.error("Error updating consultation type:", error);
    res
      .status(500)
      .json({ error: "Échec de la mise à jour du type de consultation" });
  }
};

export const getTemplatesByType = async (req: Request, res: Response) => {
  try {
    const { typeId } = req.params;
    const templates = await db
      .select()
      .from(consultationTemplates)
      .where(eq(consultationTemplates.consultationTypeId, typeId))
      .orderBy(desc(consultationTemplates.createdAt));
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Échec de la récupération des modèles" });
  }
};

export const createTemplateVersion = async (req: Request, res: Response) => {
  try {
    const { typeId } = req.params;
    const { version, structure, template, isActive } = req.body;

    if (isActive) {
      await db
        .update(consultationTemplates)
        .set({ isActive: false })
        .where(eq(consultationTemplates.consultationTypeId, typeId));
    }

    const [newTemplate] = await db
      .insert(consultationTemplates)
      .values({
        consultationTypeId: typeId,
        version,
        structure,
        template,
        isActive: isActive || false,
      })
      .returning();

    res.json(newTemplate);
  } catch (error) {
    console.error("Error creating template version:", error);
    res
      .status(500)
      .json({ error: "Échec de la création de la version du modèle" });
  }
};

export const setActiveTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const [template] = await db
      .select()
      .from(consultationTemplates)
      .where(eq(consultationTemplates.id, templateId));

    if (!template) {
      return res.status(404).json({ error: "Modèle non trouvé" });
    }

    await db
      .update(consultationTemplates)
      .set({ isActive: false })
      .where(
        eq(
          consultationTemplates.consultationTypeId,
          template.consultationTypeId
        )
      );

    const [updatedTemplateResult] = await db
      .update(consultationTemplates)
      .set({ isActive: true })
      .where(eq(consultationTemplates.id, templateId))
      .returning();

    res.json(updatedTemplateResult);
  } catch (error) {
    console.error("Error setting active template:", error);
    res.status(500).json({ error: "Échec de l'activation du modèle" });
  }
};

export const getActiveTemplateByType = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [type] = await db
      .select()
      .from(consultationTypes)
      .where(eq(consultationTypes.slug, slug));

    if (!type) {
      return res.status(404).json({ error: "Type de consultation non trouvé" });
    }

    const [activeTemplate] = await db
      .select()
      .from(consultationTemplates)
      .where(
        and(
          eq(consultationTemplates.consultationTypeId, type.id),
          eq(consultationTemplates.isActive, true)
        )
      );

    if (!activeTemplate) {
      return res.status(404).json({ error: "Aucun modèle actif trouvé" });
    }

    res.json(activeTemplate);
  } catch (error) {
    console.error("Error fetching active template:", error);
    res.status(500).json({ error: "Échec de la récupération du modèle actif" });
  }
};

export const deleteTemplateVersion = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const [deletedTemplate] = await db
      .delete(consultationTemplates)
      .where(eq(consultationTemplates.id, templateId))
      .returning();

    if (!deletedTemplate) {
      return res.status(404).json({ error: "Modèle non trouvé" });
    }

    res.json({ success: true, message: "Modèle supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting template version:", error);
    res.status(500).json({ error: "Échec de la suppression de la version du modèle" });
  }
};

export const deleteConsultationType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;


    const [deletedType] = await db
      .update(consultationTypes)
      .set({ deleted: true })
      .where(eq(consultationTypes.id, id))
      .returning();

    if (!deletedType) {
      return res.status(404).json({ error: "Type de consultation non trouvé" });
    }

    res.json({ success: true, message: "Type de consultation supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting consultation type:", error);
    res.status(500).json({ error: "Échec de la suppression du type de consultation" });
  }
};
