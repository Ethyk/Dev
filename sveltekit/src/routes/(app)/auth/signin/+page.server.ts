import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { formSchema, loginSchema } from '$lib/schema/schema';  // Ton schéma Zod
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { AuthClient } from '$lib/sdk/auth';



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
	const auth = new AuthClient('http://localhost:8000', event.cookies);

	try {
		await auth.login(email, password);
	  return { form };
		throw redirect(302, '/dashboard');
	  } catch (e: any) {
		return fail(401, { form, message: e.message || 'Échec de la connexion' });
	  }
	}

    // try {
    //   // 1. Récupérer le cookie CSRF
	// 	const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
	// 		method: 'GET',
	// 		credentials: 'include',
	// 		headers: { 'Content-Type': 'application/json' },
	// 	});
		
	// 	if (!csrfResponse.ok) {
	// 		return fail(500, { form, message: 'Erreur lors de la récupération du cookie CSRF' });
	// 	}
  
	// 	// 2. Récupérer le cookie XSRF-TOKEN depuis la réponse
	// 	const setCookie = csrfResponse.headers.get('set-cookie');
		
	// 	if (!setCookie) {
	// 		return fail(500, { form, message: 'Impossible de récupérer le cookie XSRF-TOKEN' });
	// 	}
	// 	const cookies = setCookie
	// 		.split(',')
	// 		.map(cookieStr => cookieStr.split(';')[0].trim())
	// 		.join('; ');


		
	// 	// Extraire la valeur du cookie XSRF-TOKEN
	// 	const xsrfMatch = setCookie.match(/XSRF-TOKEN=([^;]+)/);
	// 	if (!xsrfMatch) {
	// 		return fail(500, { form, message: 'Impossible d’extraire le token CSRF' });
	// 	}
	// 	const xsrfToken = decodeURIComponent(xsrfMatch[1]);
		
	// 	// 3. Envoyer le token dans le header lors du login
	// 	const loginResponse = await fetch('http://localhost:8000/login', {
	// 		method: 'POST',
	// 		credentials: 'include',
	// 		headers: {
	// 		// cookie: event.request.headers.get('cookie') || '',
	// 		'Accept': 'application/json',
	// 		'Origin': 'http://localhost:5173',
	// 		'Content-Type': 'application/json',
	// 		'X-XSRF-TOKEN': xsrfToken, // <-- Obligatoire pour Laravel Sanctum
	// 		'Cookie': cookies, // <-- Ajoute ce header !
	// 		},
	// 		body: JSON.stringify({ email, password }),
	// 	});
		
	
	// 	if (!loginResponse.ok) {
	// 		const errorData = await loginResponse.json();
	// 		return fail(401, { form, message: errorData.message || 'Échec de la connexion' });
	// 	}

    //   // Étape 3 : Extraire le cookie laravel_session (si authentification réussie)
    //   const setCookieHeader = loginResponse.headers.get('set-cookie');
    //   if (setCookieHeader) {
    //     const sessionMatch = setCookieHeader.match(/laravel_session=([^;]+)/);
		
    //     if (sessionMatch) {
	// 		const decoded = decodeURIComponent(sessionMatch[1]);

    //       event.cookies.set('laravel_session', decoded, {

    //         httpOnly: true,
    //         secure: false,
    //         sameSite: 'strict',
    //         path: '/',
    //       });
    //     }
	// 	// XSRF-TOKEN
	// 	// const xsrfMatch = setCookieHeader.match(/XSRF-TOKEN=([^;]+)/);
	// 	// if (xsrfMatch) {
	// 	//   event.cookies.set('XSRF-TOKEN', xsrfMatch[1], {
	// 	// 	httpOnly: false, // ATTENTION: doit être accessible par JS !
	// 	// 	secure: false,   // true en prod
	// 	// 	sameSite: 'strict',
	// 	// 	path: '/',
	// 	//   });
	// 	// }
    //   }
	//   	// event.cookies.delete('laravel_session', { path: '/' });
	// 	// event.cookies.delete('XSRF-TOKEN', { path: '/' });

	//   return { form };
    //   // Redirection vers le dashboard après la connexion réussie
    // //   throw redirect(302, '/dashboard');
	// 	} catch (e) {
	// 	console.error('Erreur lors du login:', e);
	// 	return fail(500, { form, message: 'Erreur interne du serveur' });
	// 	}
	// },
};
