// import { redirect } from '@sveltejs/kit';
// import type { Actions } from './$types';
// import { AuthClient } from '$lib/api/auth';
// import { setCookies, deleteCookies } from '$lib/utils/cookies';

// export const load = async (event) => {
//   if (!event.locals.user) {
//     console.log('[Logout] No user, redirecting to signin');
//     throw redirect(302, '/auth/signin');
//   }
//   console.log('[Logout] Session valid, user:', event.locals.user.email);
// };

// export const actions: Actions = {
//   default: async (event) => {
//     const auth = new AuthClient();
//     try {
//       console.log('[Logout] Attempting logout for user:', event.locals.user?.email);
//       const { response, cookies } = await auth.logout(event);

//       if (response.ok) {
//         if (cookies && cookies.length > 0) {
//           setCookies(cookies, event.cookies);
//         } else {
//           deleteCookies(event.cookies);
//         }
//         event.locals.user = null;
//         event.locals.xsrfToken = null;
//         console.log('[Logout] Session invalidated, redirecting to signin');
//         throw redirect(303, '/auth/signin');
//       }

//       console.error('[Logout] Failed to logout:', response.status);
//       deleteCookies(event.cookies);
//       event.locals.user = null;
//       event.locals.xsrfToken = null;
//       throw redirect(303, '/auth/signin');
//     } catch (error) {
//       console.error('[Logout] Failed to logout:', error);
//       deleteCookies(event.cookies);
//       event.locals.user = null;
//       event.locals.xsrfToken = null;
//       console.log('[Logout] Deleted cookies due to error, redirecting to signin');
//       throw redirect(303, '/auth/signin');
//     }
//   },
// };


// src/routes/auth/logout/+page.server.ts
import { type Actions, redirect } from '@sveltejs/kit';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { dev } from '$app/environment';

export const actions: Actions = {
	// Utilise 'default' car c'est l'action principale pour cette route
	default: async (event) => {
		const { fetch, locals } = event; // Utilise event.fetch
		const logPrefix = '[Logout Action]';

		if (dev) console.log(`${logPrefix} Attempting logout via API...`);

		try {
			// Appelle l'endpoint de déconnexion de Laravel
			// handleFetch interceptera cet appel, ajoutera les cookies actuels et headers
			const response = await fetch(`${PUBLIC_API_BASE_URL}/logout`, {
				method: 'POST',
				headers: {
					// Pas besoin de body ou Content-Type spécifique ici
				}
			});

			if (dev) console.log(`${logPrefix} API response status: ${response.status}`);

			// handleFetch aura (normalement) capturé les Set-Cookie envoyés par Laravel
			// pour invalider la session (même si la réponse n'est pas ok, ex: 401 si déjà déconnecté)
			// et les stockera dans locals.apiResponseCookies.

			if (!response.ok && response.status !== 401) {
				// Logue une erreur si l'API renvoie une erreur inattendue (pas 2xx et pas 401)
				console.warn(`${logPrefix} Logout API responded with unexpected status: ${response.status}`);
			}

		} catch (error) {
			console.error(`${logPrefix} API call failed:`, error);
			// On continue quand même vers la redirection pour déconnecter côté client
		}

		// Efface l'utilisateur dans les locals pour cette requête spécifique
		locals.user = null;
		if (dev) console.log(`${logPrefix} Cleared locals.user.`);

		// Redirige vers la page de connexion.
		// handleInitialize ajoutera les Set-Cookie (récupérés par handleFetch)
		// à cette réponse de redirection pour effacer les cookies du navigateur.
		throw redirect(303, '/auth/signin'); // Ou une autre page publique
	}
};

// Optionnel : On pourrait ajouter une fonction load ici pour rediriger
// si l'utilisateur essaie d'accéder à GET /auth/logout directement,
// mais une simple action POST est souvent suffisante.
// export const load = () => { throw redirect(303, '/') };