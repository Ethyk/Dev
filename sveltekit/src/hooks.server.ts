import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import cookie from 'cookie';
import { api } from '$lib/utils/api'; // Ajuste le chemin si nécessaire
import type { User } from '$lib/types';

// Noms des cookies (lire depuis .env ou définir ici)
const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session';
const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN';

export const handle: Handle = async ({ event, resolve }) => {
    const requestCookies = cookie.parse(event.request.headers.get('cookie') || '');
    const sessionCookieValue = requestCookies[SESSION_COOKIE_NAME];
    const xsrfCookieValue = requestCookies[XSRF_COOKIE_NAME];
    let cookiesToSetOnResponse: string[] = []; // Pour accumuler les Set-Cookie à renvoyer

    event.locals.user = null; // Initialiser

    // --- 1. Initialisation CSRF ---
    // Si le cookie XSRF manque DANS LA REQUÊTE DU NAVIGATEUR, on le demande au backend.
    // C'est typique lors de la toute première visite ou si les cookies ont été effacés.
    // On le fait sur GET pour éviter de le demander sur chaque POST/PUT etc. où il est déjà censé être là.
    if (!xsrfCookieValue && event.request.method === 'GET') {
        console.log(`[HOOKS] Missing ${XSRF_COOKIE_NAME} cookie on GET request. Requesting new CSRF cookie...`);
        try {
            // Appel à Laravel pour obtenir les cookies initiaux (session + xsrf)
            const csrfResponse = await api({
                method: 'get',
                resource: 'sanctum/csrf-cookie', // Route Sanctum standard
                event: event, // Passe l'event pour utiliser event.fetch et sa gestion des cookies
            });

            // Récupérer les en-têtes Set-Cookie de la réponse de Laravel
            const setCookieHeader = csrfResponse.headers.get('set-cookie');
            if (setCookieHeader) {
                // Split pour gérer plusieurs cookies potentiels dans un seul header
                const separateCookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/);
                cookiesToSetOnResponse.push(...separateCookies); // Ajoute les CHAÎNES BRUTES Set-Cookie
                console.log(`[HOOKS] Received ${separateCookies.length} Set-Cookie header(s) from /sanctum/csrf-cookie.`);
            } else {
                 console.warn('[HOOKS] No Set-Cookie header received from /sanctum/csrf-cookie.');
            }
        } catch (error) {
            console.error('[HOOKS] Error fetching CSRF cookie:', error);
            // On continue quand même, la prochaine requête protégée échouera si le token manque vraiment.
        }
    }

    // --- 2. Vérification de l'utilisateur ---
    // Si le cookie de session EXISTE dans la requête du navigateur, tentons de récupérer l'utilisateur.
    if (sessionCookieValue && !event.locals.user) {
         console.log(`[HOOKS] Found ${SESSION_COOKIE_NAME} cookie. Checking user status...`);
        try {
            const userResponse = await api({
                method: 'get',
                resource: 'api/user', // Route API protégée par Sanctum
                event: event,
            });

            if (userResponse.ok) {
                // Attention: .json() consomme le body. Ne pas l'appeler deux fois.
                const userData = await userResponse.json();
                if (userData) { // Laravel 11 renvoie le user directement, pas { user: ... }
                    event.locals.user = userData as User;
                    console.log('[HOOKS] User is logged in:', event.locals.user?.email);
                } else {
                     console.log('[HOOKS] API /api/user responded OK but returned no user data.');
                     // Session peut-être invalide côté backend?
                }
            } else if (userResponse.status === 401 || userResponse.status === 419) {
                console.log(`[HOOKS] User session invalid or expired (API returned ${userResponse.status}). User is logged out.`);
                // Pas besoin d'action ici, l'accès aux pages protégées échouera.
            } else {
                console.error(`[HOOKS] Error checking logged-in status via /api/user: ${userResponse.status} ${userResponse.statusText}`);
            }
        } catch (error) {
            console.error('[HOOKS] Network error fetching user status:', error);
        }
    } else if (!sessionCookieValue) {
         console.log(`[HOOKS] No ${SESSION_COOKIE_NAME} cookie found in request. User is logged out.`);
    }

    // --- 3. Résolution de la requête par SvelteKit (load, action, rendu) ---
    // `resolve` peut aussi ajouter ses propres `Set-Cookie` (par ex. via `event.cookies.set` dans une action, même si on évite ici)
    const response = await resolve(event);

    // --- 4. Ajout des Set-Cookie accumulés à la réponse FINALE ---
    // On ajoute les Set-Cookie qu'on a récupérés (ex: du /sanctum/csrf-cookie)
    // à la réponse que SvelteKit s'apprête à envoyer au NAVIGATEUR.
    // `append` est utilisé pour ne pas écraser d'autres Set-Cookie potentiels.
	if (cookiesToSetOnResponse.length > 0) {

			cookiesToSetOnResponse.forEach(cookieHeader => {
				// console.log(`[HOOKS] Appending Set-Cookie to final response: ${cookieHeader.split('=')[0]}=...`); // Log le nom du cookie
				response.headers.append('set-cookie', cookieHeader);
			});
	}

    // --- 5. Retourner la réponse finale au navigateur ---
    return response;
};

// class SuperFormSafeRedirect extends Error {
// 	constructor(public location: string, public status: number){
// 		super('Redirect')
// 	}
// }
