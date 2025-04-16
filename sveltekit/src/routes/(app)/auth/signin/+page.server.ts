// import { superValidate } from 'sveltekit-superforms/server';
// import { fail, redirect } from '@sveltejs/kit';
// import { z } from 'zod';
// import type { Actions } from './$types';
// import { loginSchema } from '$lib/schema/schema';
// import { zod } from 'sveltekit-superforms/adapters';


// export const load = async () => {
//   // Initialiser le formulaire avec superValidate
//   const form = await superValidate(zod(loginSchema));

//   return {
//     form
//   };
// };

// export const actions: Actions = {
//   default: async (event) => {
//     // Valider les données du formulaire avec superValidate
//     const form = await superValidate(event, zod(loginSchema));

//     // Si le formulaire n'est pas valide, retourner les erreurs
//     if (!form.valid) {
//       return fail(400, { form });
//     }
//     try {
//         // Étape 1 : Obtenir le cookie CSRF depuis Laravel
//         const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
//             method: 'GET',
//             credentials: 'include'
//         });
//         console.log(csrfResponse)
        
//       if (!csrfResponse.ok) {
//         return fail(500, { form, message: 'Erreur lors de la récupération du cookie CSRF' });
//       }

//       // Étape 2 : Envoyer les données de connexion à Laravel
//       const loginResponse = await fetch('http://localhost:8000/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
       

//         },
//         credentials: 'include',
//         body: JSON.stringify(form.data) // Utiliser les données validées par superValidate
//       });


//       if (!loginResponse.ok) {
//         const errorData = await loginResponse.json();
//         return fail(401, {
//           form,
//           message: errorData.message || 'Échec du login'
//         });
//       }

//       // Étape 3 : Transférer les cookies Laravel au client
//       const setCookieHeader = loginResponse.headers.get('set-cookie');
//       if (setCookieHeader) {
//         event.cookies.set('laravel_session', setCookieHeader, {
//           httpOnly: false,
//           secure: true,
//           sameSite: 'strict',
//           path: '/'
//         });
//       }

//       return { form };

//       // Rediriger vers une page sécurisée après connexion
//       throw redirect(302, '/dashboard');
//     } catch (e) {
//       console.error('Erreur lors du processus de connexion :', e);
//       return fail(500, { form, message: 'Erreur interne du serveur' });
//     }
//   }
// };
import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schema/schema';

export const load = async () => {
  // Initialiser le formulaire avec superValidate
  const form = await superValidate(zod(loginSchema));

  return {
    form
  };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(loginSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		await new Promise((resolve) => setTimeout(resolve, 800));
		return {
			form
		};
	}
};
// export const actions: Actions = {
//   default: async (event) => {
//     // 1. Validation du formulaire
//     const form = await superValidate(event, zod(loginSchema));
//     if (!form.valid) {
//       return fail(400, { form });
//     }

//     try {
//       // 2. Récupérer le cookie CSRF depuis Laravel
//       const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
//         method: 'GET',
//         headers: {
//           'Accept': 'application/json'
//         },
//         credentials: 'include'
//       });
      
//       if (!csrfResponse.ok) {
//           return fail(500, { form, message: 'Erreur lors de la récupération du cookie CSRF' });
//         }
        
//         // 3. Récupérer le XSRF-TOKEN depuis les cookies de la réponse
//         // En environnement serveur, il faut parser le header 'set-cookie'
//         const setCookie = csrfResponse.headers.get('set-cookie');
//         let xsrfToken: string | null = null;
//         if (setCookie) {
//             // Recherche du cookie XSRF-TOKEN dans le header
//             const match = setCookie.match(/XSRF-TOKEN=([^;]+)/);
//             if (match) {
//                 xsrfToken = decodeURIComponent(match[1]);
//             }
//         }
        
//         if (!xsrfToken) {
//             return fail(500, { form, message: 'Impossible de récupérer le XSRF-TOKEN' });
//       }
      
//       // 4. Envoyer les données de connexion à Laravel
//       const loginResponse = await fetch('http://localhost:8000/login', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json',
//               'Accept': 'application/json',
//               'X-XSRF-TOKEN': xsrfToken
//             },
//             credentials: 'include',
//             body: JSON.stringify(form.data)
//         });
        
//         console.log(await loginResponse.json())

//       if (!loginResponse.ok) {
//         let errorMessage = 'Échec du login';
//         try {
//           const errorData = await loginResponse.json();
//           errorMessage = errorData.message || errorMessage;
//         } catch {
//           // Si la réponse n'est pas du JSON, on garde le message par défaut
//         }
//         return fail(401, { form, message: errorMessage });
//       }

//       // 5. Transférer les cookies Laravel au client
//       const loginSetCookie = loginResponse.headers.get('set-cookie');
//       if (loginSetCookie) {
//         // Ici, tu peux parser et set les cookies nécessaires (ex: laravel_session)
//         // Pour un usage avancé, tu pourrais parser tous les cookies et les set un par un
//         const sessionMatch = loginSetCookie.match(/laravel_session=([^;]+)/);
//         if (sessionMatch) {
//           event.cookies.set('laravel_session', sessionMatch[1], {
//             httpOnly: false,
//             secure: true,
//             sameSite: 'strict',
//             path: '/'
//           });
//         }
//       }

//       // 6. Rediriger vers une page sécurisée après connexion
//       throw redirect(302, '/dashboard');
//     } catch (e) {
//       console.error('Erreur lors du processus de connexion :', e);
//       return fail(500, { form, message: 'Erreur interne du serveur' });
//     }
//   }
// };
