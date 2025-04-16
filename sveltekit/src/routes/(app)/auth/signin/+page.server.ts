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
	const auth = new AuthClient(event.cookies);

	try {
		 await auth.login(email, password, event.fetch);
	  return { form };
		throw redirect(302, '/dashboard');
	  } catch (e: any) {
		console.log(e);
		const message = e instanceof Error ? e.message : 'Erreur inconnue';

		return fail(401, { form, message: e.message || 'Échec de la connexion' });
	  }
	}

};
