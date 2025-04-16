import { z } from 'zod';

export const formSchema = z.object({
	email: z.string().email(),
});

export type FormSchema = typeof formSchema;


export const loginSchema = z.object({
  email: z.string().email({ message: "L'adresse email n'est pas valide" }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
});

export type LoginSchema = z.infer<typeof loginSchema>;



export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Le nom est requis' }),
  email: z.string().email({ message: "L'adresse email n'est pas valide" }),
  password: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  password_confirmation: z
    .string()
    .min(8, { message: 'La confirmation du mot de passe est requise' }),
}).refine((data) => data.password === data.password_confirmation, {
  path: ['password_confirmation'], // Où afficher l'erreur
  message: 'Les mots de passe ne correspondent pas',
});

export type RegisterSchema = z.infer<typeof registerSchema>;
