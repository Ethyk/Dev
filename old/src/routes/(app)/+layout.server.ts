// src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';

// Ce load s'exécute pour toutes les pages sous le dossier (app)
export const load: LayoutServerLoad = async ({ locals }) => {
    // locals.user a été potentiellement défini par le hook handle()
    console.log('[LAYOUT LOAD] Passing user to layout data:', locals.user ? locals.user.email : 'null');
    return {
        user: locals.user
        // Tu peux charger d'autres données globales pour le layout ici si nécessaire
    };
};

