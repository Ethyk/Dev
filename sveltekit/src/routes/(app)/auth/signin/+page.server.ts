import { fail, redirect } from '@sveltejs/kit';
import { superValidate, actionResult  } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { formSchema, loginSchema } from '$lib/schema/schema';  // Ton schéma Zod
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { AuthClient } from '$lib/sdk/auth';
import { api } from '$lib/utils/api';
import cookie from 'cookie';
import setCookieParser from 'set-cookie-parser';




export const load = async () => {
	return {
		form: await superValidate(zod(loginSchema))
	};
};


export const actions: Actions = {
  default: async (event) => {
    // Validation avec Zod
    const form = await superValidate(event, zod(loginSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { email, password } = form.data;
	// const auth = new AuthClient(event.cookies);

	try {
		//  await auth.login(email, password, event.fetch);
		// const response = await api({
		// 	method: 'post',
		// 	resource: 'login',
		// 	data: form.data,
		// 	// data: {
		// 	// 	'email': email ??  undefined,
		// 	// 	'password': password ??  undefined,
		// 	// },
		// 	event,
		// });
		const response = await api({
            method: 'post',
            resource: 'login', // Route WEB Laravel pour le login (qui gère la session et les cookies)
            data: form.data,
            event: event, // Crucial pour passer event.fetch et les cookies
        });
		console.log("response : ", await response.json());
		console.log("response : ",response);
		// On récupère tous les cookies Laravel
		// const setCookie = response.headers.get('set-cookie');
		// if (setCookie) {
		// // Le header peut contenir plusieurs cookies séparés par des virgules
		// // On split sur les vraies séparations de cookies (pas sur les virgules dans les options)
		// const cookies = setCookie.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/);
		// 	console.log("LOOOOOOOk",cookies);
		// // On cherche le cookie laravel_session
		// const laravelSessionCookie = cookies.find(c => c.trim().startsWith('laravel_session='));
		// if (laravelSessionCookie) {
		// 	// OlaravelSessionCookien extrait la valeur avant le premier ';'
		// 	// decodeURIComponent(match[1])
		// 	const value = laravelSessionCookie.split(';')[0].split('=')[1];
		// 	event.cookies.set('laravel_session', decodeURIComponent(value), {
		// 	path: '/',
		// 	httpOnly: true,
		// 	sameSite: 'lax',
		// 	secure: process.env.NODE_ENV === 'production'
		// 	});
		// 	console.log('laravel_session set:', value);
		// }
		
		// const xsrfSessionCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));
		// if (xsrfSessionCookie) {
		// 	// On extrait la valeur avant le premier ';'
		// 	// decodeURIComponent(match[1])
		// 	const value = xsrfSessionCookie.split(';')[0].split('=')[1];
		// 	event.cookies.set('XSRF-TOKEN', decodeURIComponent(value), {
		// 	path: '/',
		// 	httpOnly: true,
		// 	sameSite: 'lax',
		// 	secure: process.env.NODE_ENV === 'production'
		// 	});
		// 	console.log('laravel_session set:', value);
		// }
		// }

	
		if (response.ok)
		{
			const setCookieHeader = response.headers.get('set-cookie');
			if (setCookieHeader) {
				const cookies = setCookieParser.parse(response);
				for (const cookie of cookies) {
					console.log(cookie);
					console.log("fdsffds",cookies);

					event.cookies.set(cookie.name, cookie.value, {
					path: cookie.path ?? '/',
					httpOnly: cookie.httpOnly,
					sameSite: cookie.sameSite ?? 'lax',
					secure: cookie.secure,
					expires: cookie.expires
					});
				}
			}
			
			return { form };
		}
		return fail(401, { form, message : 'Échec de la connexion' });

		throw redirect(302, '/dashboard');
	  } catch (e: any) {
		console.log(e);
		const message = e instanceof Error ? e.message : 'Erreur inconnue';

		return fail(401, { form, message: e.message || 'Échec de la connexion' });
	  }
	}

};
