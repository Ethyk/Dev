import { fail, superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from '$lib/schema/schema';
import type { Actions, PageServerLoad } from './$types'; // Utilise les types générés
import { parse, splitCookiesString } from 'set-cookie-parser';
import { redirect } from '@sveltejs/kit'; // Pour la redirection

// Récupère l'URL de l'API depuis les variables d'environnement (meilleure pratique)
// import { API_BASE_URL } from '$env/static/private'; // Si défini dans .env
const API_BASE_URL = 'http://localhost:8000'; // Ou garde en dur pour l'instant

// --- Fonction utilitaire pour relayer les cookies de Laravel vers SvelteKit/Browser ---
function applyLaravelCookies(eventCookies: Cookies, setCookieHeader: string | null) {
	if (!setCookieHeader) {
		console.warn('[applyLaravelCookies] No Set-Cookie header received from Laravel.');
		return;
	}

	try {
		const cookiesToParse = splitCookiesString(setCookieHeader); // Gère les headers multiples
		const parsedCookies = parse(cookiesToParse); // Obtenir un tableau d'objets cookie

		console.log('[applyLaravelCookies] Parsed cookies from Laravel:', parsedCookies);

		parsedCookies.forEach(cookieInfo => {
			console.log(`[applyLaravelCookies] Applying cookie: ${cookieInfo.name}`);
			eventCookies.set(cookieInfo.name, cookieInfo.value, {
				path: cookieInfo.path || '/',
				domain: cookieInfo.domain || 'localhost', // Utilise 'localhost' ou ce que Laravel envoie
				secure: cookieInfo.secure ?? process.env.NODE_ENV === 'production', // true en prod (HTTPS), false en dev (HTTP) - A adapter si tu utilises HTTPS en local
				httpOnly: cookieInfo.httpOnly ?? true, // Généralement true pour session, false pour XSRF
				sameSite: cookieInfo.sameSite ? cookieInfo.sameSite.toLowerCase() as 'lax' | 'strict' | 'none' : 'lax',
				expires: cookieInfo.expires,
				maxAge: cookieInfo.maxAge
			});
		});
		console.log('[applyLaravelCookies] Cookies applied to SvelteKit response.');

	} catch (error) {
		console.error("[applyLaravelCookies] Error parsing or applying cookies:", error);
		console.error("[applyLaravelCookies] Raw Set-Cookie header:", setCookieHeader);
	}
}
// --- Fin de la fonction utilitaire ---

export const load: PageServerLoad = async () => {
	// Pré-remplit le formulaire pour Superforms
	return {
		form: await superValidate(zod(formSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, fetch: eventFetch } = event; // Utilise eventFetch pour potentiellement bénéficier du proxying SvelteKit

		const form = await superValidate(request, zod(formSchema));
		console.log('[Login Action] Form validation:', form.valid ? 'Valid' : 'Invalid', form.data);

		if (!form.valid) {
            console.log('[Login Action] Form invalid. Errors:', form.errors);
			// Utilise `message` pour renvoyer le formulaire invalide avec ses erreurs
			return message(form, 'Invalid form data.', { status: 400 });
		}

		// Récupère les cookies existants envoyés par le navigateur à SvelteKit
		// `eventFetch` devrait les transmettre automatiquement si les domaines correspondent,
		// mais pour être explicite et gérer les cas où ça ne marche pas (ex: domaines différents même sur localhost),
		// on peut les récupérer et les passer manuellement.
        const browserCookies = request.headers.get('cookie') || '';
        console.log('[Login Action] Browser cookies sent to SvelteKit server:', browserCookies);


		let laravelSessionCookieHeader: string | null = null;
        let xsrfTokenValue: string | undefined = undefined;

		try {
			// --- 1. Assurer le Cookie CSRF ---
			console.log('[Login Action] Fetching CSRF cookie...');
            const csrfResponse = await eventFetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                headers: {
                    // Transmet les cookies du navigateur à Laravel pour qu'il sache s'il doit en générer un nouveau
                    'Cookie': browserCookies,
                    'Accept': 'application/json', // Optionnel mais bonne pratique
                    'Origin': 'http://localhost:5173' // Adapter si ton origine SvelteKit est différente
                },
                 // credentials: 'omit' // Ne pas utiliser avec fetch côté serveur, gérer manuellement via header Cookie
            });

            if (!csrfResponse.ok) {
                console.error(`[Login Action] CSRF cookie request failed. Status: ${csrfResponse.status}`);
                // Tenter de continuer, peut-être que le cookie existe déjà
            }

			// Récupère le header Set-Cookie de la réponse CSRF
            const csrfSetCookieHeader = csrfResponse.headers.get('set-cookie');
            if (csrfSetCookieHeader) {
                console.log('[Login Action] Set-Cookie header from CSRF response:', csrfSetCookieHeader);
				// Applique immédiatement ce cookie à la réponse sortante de SvelteKit vers le navigateur
                applyLaravelCookies(cookies, csrfSetCookieHeader);

                // Trouve la valeur du XSRF-TOKEN pour l'utiliser dans le header de la requête de login
                 const parsedCsrfCookies = parse(splitCookiesString(csrfSetCookieHeader), { map: true });
                 if (parsedCsrfCookies['XSRF-TOKEN']) {
                    // Le cookie XSRF-TOKEN est encodé URL, il faut le décoder pour le header X-XSRF-TOKEN
                    xsrfTokenValue = decodeURIComponent(parsedCsrfCookies['XSRF-TOKEN'].value);
                    console.log('[Login Action] Extracted XSRF-TOKEN value:', xsrfTokenValue);
                 }
            }

            // Si on n'a pas reçu de nouveau XSRF-TOKEN, essayer de le trouver dans les cookies du navigateur
            if (!xsrfTokenValue) {
                 const match = browserCookies.match(/XSRF-TOKEN=([^;]+)/);
                 if (match && match[1]) {
                    xsrfTokenValue = decodeURIComponent(match[1]);
                    console.log('[Login Action] Using existing XSRF-TOKEN from browser cookies:', xsrfTokenValue);
                 }
            }

			if (!xsrfTokenValue) {
				console.error("[Login Action] Failed to obtain XSRF Token.");
                // Retourne une erreur via Superforms
                return message(form, 'Could not initialize security token. Please try again.', { status: 500 });
			}

			// --- 2. Tentative de Connexion / Inscription ---
            const endpoint = form.data.isRegister ? '/register' : '/login'; // Utilise les routes Fortify par défaut
			console.log(`[Login Action] Attempting ${endpoint} with XSRF Token: ${xsrfTokenValue}`);

            // Préparer le header Cookie pour l'appel login/register
            // Utilise les cookies du navigateur + le nouveau XSRF si on vient de le recevoir
            let loginCookies = browserCookies;
            // Si on a reçu un nouveau Set-Cookie pour XSRF, s'assurer qu'il est bien dans ce qu'on envoie
            // (Normalement, applyLaravelCookies l'a mis dans `cookies`, mais l'appel fetch suivant ne le verra pas encore)
            // On reconstruit une chaîne de cookie à envoyer. C'est un peu délicat.
            // Le plus simple est de re-lire les cookies qui *vont* être envoyés au navigateur.
            const outgoingCookiesArray = cookies.getAll();
            loginCookies = outgoingCookiesArray.map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
            console.log('[Login Action] Cookies being sent to Laravel for login/register:', loginCookies);


			const authResponse = await eventFetch(`${API_BASE_URL}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest', // Important pour que Laravel reconnaisse la requête AJAX/API
                    'X-XSRF-TOKEN': xsrfTokenValue,     // Le header CSRF requis par Sanctum
					'Cookie': loginCookies, // Envoie les cookies (y compris le XSRF-TOKEN cookie)
                    'Origin': 'http://localhost:5173' // Adapter si nécessaire
				},
				body: JSON.stringify({ // Envoie seulement les données nécessaires à Fortify
                    email: form.data.email,
                    password: form.data.password,
                    ...(form.data.isRegister && { name: form.data.name, password_confirmation: form.data.password }) // Ajoute name et confirmation si register
                }),
                // credentials: 'omit'
			});

			console.log(`[Login Action] Laravel ${endpoint} response status:`, authResponse.status);

			// Récupère TOUS les cookies définis par Laravel (Session, peut-être XSRF rafraîchi)
            laravelSessionCookieHeader = authResponse.headers.get('set-cookie');
            if (laravelSessionCookieHeader) {
                console.log(`[Login Action] Set-Cookie header from Laravel ${endpoint} response:`, laravelSessionCookieHeader);
                // Applique ces cookies (laravel_session, etc.) à la réponse sortante de SvelteKit
                applyLaravelCookies(cookies, laravelSessionCookieHeader);
            }


			// --- 3. Gérer la Réponse ---
			if (!authResponse.ok) {
				console.error(`[Login Action] ${endpoint} failed. Status: ${authResponse.status}`);
				const errorData = await authResponse.json().catch(() => ({ message: 'Authentication failed with status ' + authResponse.status }));
                console.error('[Login Action] Error data from Laravel:', errorData);

                // Retourne l'erreur via Superforms `message` pour l'afficher dans le toast
                // Essaye de récupérer un message d'erreur spécifique de Laravel (validation, etc.)
                const errorMessage = errorData.message || (form.data.isRegister ? 'Registration failed.' : 'Login failed.');
                // Si Laravel renvoie des erreurs de validation spécifiques (ex: 422)
                if (authResponse.status === 422 && errorData.errors) {
                    // Tu pourrais mapper errorData.errors aux champs du formulaire Superforms ici si nécessaire
                    // form.errors.email = errorData.errors.email?.[0]; // Exemple
                    // Pour l'instant, on renvoie juste le message principal
                     return message(form, errorMessage, { status: authResponse.status });
                }

				return message(form, errorMessage, { status: authResponse.status }); // Utilise message()
			}

            // Connexion/Inscription réussie !
			console.log(`[Login Action] ${endpoint} successful.`);
            const responseData = await authResponse.json();
            console.log('[Login Action] Success data from Laravel:', responseData);


            // Option 1: Retourner un message de succès avec les données utilisateur
            // Le `onResult` dans le .svelte peut alors utiliser `invalidateAll()` pour rafraîchir l'état global
             return message(form, responseData); // Superforms >= 2.0 gère ça

            // Option 2: Rediriger l'utilisateur directement depuis le serveur
            //  throw redirect(303, '/dashboard'); // Ou une autre page post-login
             // Le `throw redirect` est la manière idiomatique SvelteKit de rediriger après une action POST réussie.

		} catch (error: any) {
			console.error('[Login Action] Unexpected error:', error);
            // Gérer les erreurs réseau ou autres erreurs inattendues
            return message(form, 'An unexpected server error occurred. Please try again later.', { status: 500 }); // Utilise message()
		}
	}
};