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

	try {
		const response = await api({
            method: 'post',
            resource: 'login', // Route WEB Laravel pour le login (qui gère la session et les cookies)
            data: form.data,
            event: event, // Crucial pour passer event.fetch et les cookies
        });
	
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
	  } catch (e: any) {
		const message = e instanceof Error ? e.message : 'Erreur inconnue';
		return fail(401, { form, message: e.message || 'Échec de la connexion' });
	  }
	}

};
