// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { User } from '$lib/type';
import { getCookieValue } from '$lib/server/utils'; // Utilise l'utilitaire
import { dev } from '$app/environment';

export const load: LayoutServerLoad = async (event) => {
    const { locals, request, fetch } = event;
    const logPrefix = '[Layout Load]';

    // --- OPTIMISATION : Vérifier si l'utilisateur est déjà dans locals ---
    // Utile si un hook ou un layout parent l'avait déjà chargé.
    if (locals.user) {
        if (dev) console.log(`${logPrefix} User already found in locals:`, locals.user.email);
        return { user: locals.user };
    }
    // --------------------------------------------------------------------

    const sessionCookie = getCookieValue(request, 'laravel_session');

    if (!sessionCookie) {
        // Pas besoin de log ici, c'est normal pour un visiteur non connecté
        // locals.user est déjà null (initialisé par le hook)
        return { user: null };
    }

    // Tenter de récupérer l'utilisateur via l'API car on a un cookie de session
    if (dev) console.log(`${logPrefix} Session cookie found. Attempting fetch to /api/user...`);
    try {
        // event.fetch déclenche handleFetch qui ajoute cookies/headers
        const response = await fetch(`${PUBLIC_API_BASE_URL}/api/user`);

        if (response.ok) {
            const userData: User = await response.json();
            if (dev) console.log(`${logPrefix} User fetched successfully:`, userData.email);
            locals.user = userData; // Stocker pour d'éventuels usages ultérieurs dans cette requête
            return { user: userData };
        } else {
            // L'API a répondu mais pas OK (session invalide/expirée -> 401/419 attendu)
            if (dev) console.warn(`${logPrefix} API fetch failed. Status: ${response.status}. Returning user as null.`);
            // locals.user reste null
            return { user: null };
        }

    } catch (error) {
        console.error(`${logPrefix} Network error fetching user:`, error);
        // locals.user reste null
        return { user: null };
    }
};