import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate, setError } from 'sveltekit-superforms';
import { z } from 'zod';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { ApiClient } from '$lib/api/client';

// Schéma Zod pour le login
const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

export const load = async () => {
  return {
    form: await superValidate(zod(loginSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(loginSchema));
    if (!form.valid) {
      return fail(400, { form, message: 'Veuillez vérifier les champs du formulaire' });
    }

    // S'assurer que les cookies sont présents
    if (!event.locals.session || !event.locals.xsrf) {
      console.error('[Signin] Missing session or xsrf token');
      return fail(500, { form, message: 'Erreur serveur: session manquante' });
    }

    // Appeler l’API de login
    const auth = new AuthClient();
    let response = await auth.login(event, form.data);

    // Si 419 (CSRF mismatch), régénérer les cookies et réessayer
    if (response.response.status === 419) {
      console.log('[Signin] CSRF mismatch, regenerating tokens');
      try {
        const { session, xsrf } = await ApiClient.prototype.fetchCsrfToken(event);
        event.locals.session = session;
        event.locals.xsrf = xsrf;
        ApiClient.setCookies(event, session, xsrf);
        response = await auth.login(event, form.data); // Réessayer
      } catch (error) {
        console.error('[Signin] Failed to regenerate CSRF token:', error);
        return fail(500, { form, message: 'Erreur serveur: impossible de régénérer le token CSRF' });
      }
    }

    if (response.response.status === 422) {
      // console.log('[xx]   ', await response.response.json());
      const err = await response.response.json();
      // return fail(401, { form, message: err.message ?? 'Email ou mot de passe incorrect' });
      return setError(form, '_errors', err.message ?? 'Email ou mot de passe incorrect');

      // try {
      //   const { session, xsrf } = await ApiClient.prototype.fetchCsrfToken(event);
      //   event.locals.session = session;
      //   event.locals.xsrf = xsrf;
      //   ApiClient.setCookies(event, session, xsrf);
      //   response = await auth.login(event, form.data); // Réessayer
      // } catch (error) {
      //   console.error('[Signin] Failed to regenerate CSRF token:', error);
      //   return fail(500, { form, message: 'Erreur serveur: impossible de régénérer le token CSRF' });
      // }
    }

    if (response.response.ok) {
      if (response.session && response.xsrf) {
        event.locals.session = response.session;
        event.locals.xsrf = response.xsrf;
        console.log('[Signin] Setting cookies:', { session: response.session, xsrf: response.xsrf });
        ApiClient.setCookies(event, response.session, response.xsrf);
      } else {
        console.warn('[Signin] No cookies returned by /login');
      }
      throw redirect(303, '/dashboard');
    }

    return fail(401, { form, message: 'Email ou mot de passe incorrect' });
  },
};