import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  prenom: z.string().min(1, "Le prénom est requis."),
  dob: z.string().min(1, "La date de naissance est requise.").regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  ipp: z.string().optional(),
  sexe: z.enum(['femme', 'homme'], {
    message: "Le sexe est requis et doit être 'femme' ou 'homme'.",
  }),
});