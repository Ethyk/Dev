import { redirect, error as skError, type RequestHandler } from '@sveltejs/kit';

import { AuthClient } from '$lib/sdk/auth';
// import { api } from '../../../api';
import { api } from '$lib/utils/api';


export const actions = {
  default: async (event) => {
    
    console.log('[LOGOUT SERVER] Received POST request.');

    // Optionnel : vérifier si l'utilisateur était connecté pour éviter des appels inutiles
    if (!event.locals.user) {
        console.log('[LOGOUT SERVER] User was not logged in according to locals. Redirecting to home.');
        throw redirect(302, '/'); // Ou vers la page de connexion
    }

    try {
        console.log('[LOGOUT SERVER] Calling API to logout user:', event.locals.user.email);
        // Appel à l'API Laravel pour invalider la session
        const response = await api({
            method: 'post',
            resource: 'logout', // Route WEB Laravel pour le logout
            event: event, // Crucial
            data: null // Pas de corps nécessaire
        });

        if (response.ok) {
            // Déconnexion réussie côté Laravel.
            // Laravel a envoyé les Set-Cookie pour effacer/expirer les cookies de session/xsrf.
            console.log('[LOGOUT SERVER] Logout API call successful.');

            // Effacer l'utilisateur des locals pour la requête en cours (même si on redirige)
            event.locals.user = null;
            // event.cookies.delete();
            event.cookies.delete('laravel_session', { path: '/' });
            event.cookies.delete('XSRF-TOKEN', { path: '/' });
            // PAS BESOIN DE event.cookies.delete() ICI !
            // La redirection va transmettre les Set-Cookie d'expiration de Laravel.

            // Rediriger l'utilisateur
            throw redirect(302, '/'); // Vers la page d'accueil

        } else {
            // Si l'appel à /logout échoue côté Laravel (très rare)
            console.error(`[LOGOUT SERVER] Logout API call failed with status: ${response.status}`);
            // On essaie quand même de déconnecter côté SvelteKit si possible
            event.locals.user = null;
            // Renvoyer une erreur, mais l'utilisateur sera probablement redirigé quand même
            // ou au moins sa session locale sera effacée au prochain rechargement.
            // throw skError(response.status, 'Échec de la déconnexion côté serveur backend.');
            // Alternative plus douce : rediriger quand même
             console.warn('[LOGOUT SERVER] Proceeding with redirect despite API error.');
             throw redirect(302, '/');

        }
    } catch (error) {
        console.error('[LOGOUT SERVER] Unexpected error during logout:', error);
        // Effacer les locals en cas d'erreur aussi
        event.locals.user = null;
        // throw skError(500, 'Erreur interne lors de la déconnexion.');
        // Alternative plus douce : rediriger quand même
         console.warn('[LOGOUT SERVER] Proceeding with redirect despite unexpected error.');
         throw redirect(302, '/');
    }
  }
};