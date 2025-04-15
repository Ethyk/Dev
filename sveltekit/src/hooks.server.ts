// export const handle = async ({ event, resolve }) => {
//     const response = await resolve(event);
//     response.headers.set('x-sveltekit', '1');
//     return response;
// };

import { API_BASE_URL } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Récupérer les cookies de la requête
    const cookies = event.request.headers.get('cookie') || '';
    
    try {
        // Vérifier la session utilisateur auprès de Laravel
        const userResponse = await fetch(`${API_BASE_URL}/api/user`, {
            method: 'GET',
            headers: {
                'Cookie': cookies,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Nécessaire pour Sanctum

            },
            credentials: 'include'
        });

			console.log("response ",userResponse);


        if (userResponse.ok) {
            const user = await userResponse.json();
            event.locals.user = user;
        }
        console.log("user ",event.locals.user);
    } catch (error) {
        console.error('Session check failed:', error);
    }

    return resolve(event);
};