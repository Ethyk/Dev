// src/lib/types.ts
export interface User {
    id: number;
    name: string;
    email: string;
    // email_verified_at: string | null; // Exemple
    // created_at: string; // Exemple
    // updated_at: string; // Exemple
    // ajoute les champs que ton API /api/user renvoie réellement
}