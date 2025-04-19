import type { RequestEvent } from "@sveltejs/kit";
import cookie from 'cookie';

// Noms des cookies
const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN';

interface ApiParams {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    event: RequestEvent; // Toujours requis pour l'accès SSR à fetch et cookies
    resource: string; // Ex: 'login', 'api/user', 'sanctum/csrf-cookie'
    data?: Record<string, any> | BodyInit | null;
}

/**
 * Fonction centralisée pour effectuer des appels API vers le backend Laravel.
 * Gère automatiquement la transmission des cookies et l'ajout du header X-XSRF-TOKEN.
 */
export async function api({ method, event, resource, data }: ApiParams): Promise<Response> {
    const base = import.meta.env.VITE_BASE_API;
    if (!base) {
        console.error("FATAL: VITE_BASE_API environment variable is not set.");
        return new Response(JSON.stringify({ message: 'API configuration error.' }), { status: 500 });
    }
    const fullurl = `${base}/${resource.replace(/^\//, '')}`;

    // Lire les cookies de la requête ENTRANTE (navigateur -> SvelteKit)
    const incomingCookiesHeader = event.request.headers.get('cookie') || '';
    const parsedCookies = cookie.parse(incomingCookiesHeader);
    const xsrfTokenValue = parsedCookies[XSRF_COOKIE_NAME];

    // Préparer les headers pour la requête SORTANTE (SvelteKit -> Laravel)
    const headers: Record<string, string> = {
        'accept': 'application/json',
        // Crucial : Transmet TOUS les cookies reçus du navigateur vers le backend Laravel
        'cookie': incomingCookiesHeader
    };

    // Ajouter Content-Type pour les requêtes avec body JSON
    if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof URLSearchParams) && !(data instanceof Blob) && !(data instanceof ArrayBuffer)) {
        headers['content-type'] = 'application/json';
    }

    // Ajouter le header X-XSRF-TOKEN pour les méthodes dangereuses SI le cookie existe
    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
    if (needsCsrf) {
        if (xsrfTokenValue) {
            headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfTokenValue); // Decode est souvent nécessaire
        } else {
            // Le hook aurait dû obtenir le token sur un GET précédent.
            // Si on arrive ici, c'est probablement une tentative sans cookie CSRF valide.
            console.warn(`[API] CSRF token (${XSRF_COOKIE_NAME}) missing in request cookies for ${method.toUpperCase()} ${resource}. Laravel will likely reject with 419.`);
            // On laisse Laravel renvoyer 419, pas besoin de bloquer ici.
        }
    }

    // Préparer les options de fetch
    const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
        // Gérer différents types de body
        body: (headers['content-type'] === 'application/json')
            ? JSON.stringify(data)
            : data as BodyInit // Laisse passer FormData, etc.
    };

    // Utiliser event.fetch pour le proxying de cookies et l'isolation des requêtes SSR
    const fetcher = event.fetch;

    console.log(`[API] Sending: ${fetchOptions.method} ${fullurl}`);
    try {
        const response = await fetcher(fullurl, fetchOptions);
        console.log(`[API] Received: ${response.status} ${response.statusText} from ${fetchOptions.method} ${fullurl}`);

        // IMPORTANT : SvelteKit (via event.fetch) intercepte les Set-Cookie de cette 'response'.
        // Si on utilise cette 'response' dans un 'load' ou si on fait 'throw redirect()' après cet appel dans une 'action',
        // SvelteKit ajoutera ces Set-Cookie à la réponse finale vers le navigateur.
        return response;

    } catch (error: any) {
        console.error(`[API] Fetch failed for ${fetchOptions.method} ${fullurl}:`, error.message || error);
        // Construire une réponse d'erreur standardisée
        return new Response(JSON.stringify({ message: 'API request failed.', error: error.message || 'Unknown fetch error' }), {
            status: 503, // Service Unavailable or 500 Internal Server Error
            headers: { 'content-type': 'application/json' }
        });
    }
}