import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { setCookies } from '$lib/utils/cookies';
import { superValidate } from 'sveltekit-superforms';
import { loginSchema } from '$lib/schema/schema';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
  if (event.locals.user) {
    console.log('[Signin] User already logged in, redirecting to dashboard');
    throw redirect(302, '/dashboard');
  }
  return {
    form: await superValidate(zod(loginSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(loginSchema));
    if (!form.valid) {
      console.log('[Signin] Form validation failed:', form.errors);
      return fail(400, { form, message: 'Veuillez vérifier les champs du formulaire' });
    }

    const auth = new AuthClient();
    try {
      console.log('[Signin] Attempting login:', form.data.email);
      const { response, cookies } = await auth.login(event, form.data);

      if (response.ok) {
        if (cookies) {
          setCookies(cookies, event.cookies);
        }
        console.log('[Signin] Login successful');
        return { form, success: true }; // Retourne { form } pour Superforms
      }

      console.error('[Signin] Login failed:', response.status);
      return fail(response.status, { form, message: 'Identifiants invalides' });
    } catch (error) {
      console.error('[Signin] Login failed:', error);
      return fail(500, { form, message: 'Erreur lors de la connexion' });
    }
  },
};