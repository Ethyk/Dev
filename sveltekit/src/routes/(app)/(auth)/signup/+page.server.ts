// import { formSchema } from '$lib/schema/schema';
// import type { Actions } from '@sveltejs/kit';
// import { fail, superValidate } from 'sveltekit-superforms';
// import { zod } from 'sveltekit-superforms/adapters';

// export const load = async () => {
// 	return {
// 		form: await superValidate(zod(formSchema))
// 	};
// };

// export const actions: Actions = {
// 	default: async (event) => {
// 		const form = await superValidate(event, zod(formSchema));
// 		if (!form.valid) {
// 			return fail(400, {
// 				form
// 			});
// 		}
// 		await new Promise((resolve) => setTimeout(resolve, 800));
// 		return {
// 			form
// 		};
// 	}
// };
import { formSchema } from '$lib/schema/schema';
import type { Actions } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

// Remplacez par l'URL de votre backend Laravel
const API_BASE_URL = 'http://localhost:8000';

// function extractXSRFToken(cookieHeader: string): string {
//     const cookies = cookieHeader.split('; ');
//     for (const cookie of cookies) {
//         if (cookie.startsWith('XSRF-TOKEN=')) {
//             return decodeURIComponent(cookie.split('=')[1]);
//         }
//     }
//     throw new Error('XSRF token not found');
// }
function extractXSRFToken(cookieHeader: string): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(/,\s*/);
    for (const cookie of cookies) {
        if (cookie.startsWith('XSRF-TOKEN=')) {
            return decodeURIComponent(cookie.split('=')[1].split(';')[0]);
        }
    }
    return null;
}

export const load = async () => {
    return {
        form: await superValidate(zod(formSchema))
    };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(formSchema));
        if (!form.valid) {
			return fail(400, { form });
        }
        try {

			console.log("Tentative de récupération du CSRF...");
			const csrfResponse = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
			method: 'GET',
			credentials: 'include'
			});
			console.log("Réponse CSRF:", csrfResponse.status, await csrfResponse.text());

			// Étape 1: Récupération du cookie CSRF
            // const csrfResponse = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
			// 	method: 'GET',
            //     credentials: 'include'
            // });
			
            if (!csrfResponse.ok) {
                throw new Error('Échec de la récupération du cookie CSRF');
            }

            // Extraction du token XSRF
            const cookies = csrfResponse.headers.get('set-cookie') || '';
            const xsrfToken = extractXSRFToken(cookies);

            // Étape 2: Détermination de l'endpoint (login/register)
            const endpoint = form.data.isRegister ? '/api/register' : '/api/login';
            
			console.log("token ",xsrfToken);
			console.log("cookies ",cookies);

            // Étape 3: Envoi des données au backend
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': xsrfToken,
                    'Cookie': cookies
                },
                body: JSON.stringify({
                    email: form.data.email,
                    password: form.data.password,
                    ...(form.data.isRegister && { name: form.data.name })
                }),
                credentials: 'include'
            });


            if (!response.ok) {
                const errorData = await response.json();
                return fail(response.status, {
                    form,
                    error: errorData.message || 'Échec de l\'authentification'
                });
            }

            // Collecte des cookies de toutes les réponses
            const setCookies: string[] = [];
            const csrfCookies = csrfResponse.headers.get('set-cookie');
            const authCookies = response.headers.get('set-cookie');

            if (csrfCookies) setCookies.push(...csrfCookies.split(', '));
            if (authCookies) setCookies.push(...authCookies.split(', '));

            // Retour des cookies au client
            const headers = new Headers();
            setCookies.forEach(cookie => headers.append('Set-Cookie', cookie));

            return {
                form,
                headers: Object.fromEntries(headers.entries())
            };

        } catch (error) {
            return fail(500, {
                form,
                error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Unknown error')
            });
        }
    }
};