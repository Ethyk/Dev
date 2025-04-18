// import { redirect, error as skError, type RequestHandler } from '@sveltejs/kit';

// import { api } from '$lib/utils/api';


// export const actions = {
//   default: async (event) => {
    
//     console.log('[LOGOUT SERVER] Received POST request.');

//     // Optionnel : vérifier si l'utilisateur était connecté pour éviter des appels inutiles
//     if (!event.locals.user) {
//         console.log('[LOGOUT SERVER] User was not logged in according to locals. Redirecting to home.');
//         throw redirect(302, '/'); // Ou vers la page de connexion
//     }

//     try {
//         console.log('[LOGOUT SERVER] Calling API to logout user:', event.locals.user.email);
//         // Appel à l'API Laravel pour invalider la session
//         const response = await api({
//             method: 'post',
//             resource: 'logout', // Route WEB Laravel pour le logout
//             event: event, // Crucial
//             data: null // Pas de corps nécessaire
//         });

//         if (response.ok) {
//             // Déconnexion réussie côté Laravel.
//             // Laravel a envoyé les Set-Cookie pour effacer/expirer les cookies de session/xsrf.
//             console.log('[LOGOUT SERVER] Logout API call successful.');

//             // Effacer l'utilisateur des locals pour la requête en cours (même si on redirige)
//             event.locals.user = null;
//             // event.cookies.delete();
//             event.cookies.delete('laravel_session', { path: '/' });
//             event.cookies.delete('XSRF-TOKEN', { path: '/' });
//             // PAS BESOIN DE event.cookies.delete() ICI !
//             // La redirection va transmettre les Set-Cookie d'expiration de Laravel.

//             // Rediriger l'utilisateur
//             throw redirect(302, '/'); // Vers la page d'accueil

//         } else {
//             // Si l'appel à /logout échoue côté Laravel (très rare)
//             console.error(`[LOGOUT SERVER] Logout API call failed with status: ${response.status}`);
//             // On essaie quand même de déconnecter côté SvelteKit si possible
//             event.locals.user = null;
//             // Renvoyer une erreur, mais l'utilisateur sera probablement redirigé quand même
//             // ou au moins sa session locale sera effacée au prochain rechargement.
//             // throw skError(response.status, 'Échec de la déconnexion côté serveur backend.');
//             // Alternative plus douce : rediriger quand même
//              console.warn('[LOGOUT SERVER] Proceeding with redirect despite API error.');
//              throw redirect(302, '/');

//         }
//     } catch (error) {
//         console.error('[LOGOUT SERVER] Unexpected error during logout:', error);
//         // Effacer les locals en cas d'erreur aussi
//         event.locals.user = null;
//         // throw skError(500, 'Erreur interne lors de la déconnexion.');
//         // Alternative plus douce : rediriger quand même
//          console.warn('[LOGOUT SERVER] Proceeding with redirect despite unexpected error.');
//          throw redirect(302, '/');
//     }
//   }
// };


import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';

export const load = async (event) => {
  // Vérifier si l'utilisateur est connecté et si les cookies sont présents
  if (!event.locals.session || !event.locals.xsrf || !event.locals.user) {
    console.log('[Logout] Missing session, xsrf token, or user, redirecting to signin');
    throw redirect(302, '/auth/signin');
  }
};

export const actions: Actions = {
  default: async (event) => {
    // Vérifier que les cookies sont présents (redondant avec load, mais pour la robustesse)
    if (!event.locals.session || !event.locals.xsrf) {
      console.error('[Logout] Missing session or xsrf token');
      return fail(500, { message: 'Erreur serveur: session manquante' });
    }

    // Appeler l’API de déconnexion
    const auth = new AuthClient();
    const { response, session, xsrf } = await auth.logout(event);

    if (response.ok) {
      // Définir les nouveaux cookies "guest" renvoyés par Laravel
      if (session && xsrf) {
        event.locals.session = session;
        event.locals.xsrf = xsrf;
        event.cookies.set(session.name, session.value, {
          path: session.path || '/',
          httpOnly: session.httpOnly ?? true,
          sameSite: session.sameSite || 'lax',
          secure: session.secure ?? false,
          expires: session.expires,
          domain: session.domain || null,
        });
        event.cookies.set(xsrf.name, xsrf.value, {
          path: xsrf.path || '/',
          httpOnly: xsrf.httpOnly ?? false,
          sameSite: xsrf.sameSite || 'lax',
          secure: xsrf.secure ?? false,
          expires: xsrf.expires,
          domain: xsrf.domain || null,
        });
        console.log('[Logout] New guest cookies set:', { session, xsrf });
      } else {
        // Cas rare : aucun cookie renvoyé par Laravel
        event.locals.session = null;
        event.locals.xsrf = null;
        console.log('[Logout] No guest cookies received from Laravel');
      }

      // Réinitialiser l'utilisateur
      event.locals.user = null;

      console.log('[Logout] Session invalidated, redirecting to signin');
      throw redirect(303, '/auth/signin');
    }

    console.error('[Logout] Failed to logout:', response.status);
    return fail(500, { message: 'Erreur lors de la déconnexion' });
  },
};