import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { ApiClient } from '$lib/api/client';
import { zod } from 'sveltekit-superforms/adapters';

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

// export const actions: Actions = {
//   default: async (event) => {
//     const form = await superValidate(event, zod(loginSchema));
//     if (!form.valid) {
//       return fail(400, { form });
//     }

//     // Supprimer les cookies existants
//     event.cookies.delete(import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session', { path: '/' });
//     event.cookies.delete(import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN', { path: '/' });
//     event.locals.session = null;
//     event.locals.xsrf = null;

//     // Régénérer les cookies avant login
//     const api = new ApiClient();
//     try {
//       const { session, xsrf } = await api.fetchCsrfToken(event);
//       event.locals.session = session;
//       event.locals.xsrf = xsrf;

//       // Définir les cookies immédiatement
//       event.cookies.set(session.name, session.value, {
//         path: session.path || '/',
//         httpOnly: session.httpOnly || false,
//         sameSite: session.sameSite || 'lax',
//         secure: session.secure || false,
//         expires: session.expires,
//         domain: session.domain,
//       });
//       event.cookies.set(xsrf.name, xsrf.value, {
//         path: xsrf.path || '/',
//         httpOnly: xsrf.httpOnly || false,
//         sameSite: xsrf.sameSite || 'lax',
//         secure: xsrf.secure || false,
//         expires: xsrf.expires,
//         domain: xsrf.domain,
//       });
//     } catch (error) {
//       console.error('[Signin] Failed to fetch CSRF token:', error);
//       return fail(500, { form, message: 'Erreur serveur' });
//     }

//     // Appeler l’API de login
//     const auth = new AuthClient();
//     const { response, session, xsrf } = await auth.login(event, form.data);

//     if (response.ok) {
//       // Stocker les cookies fournis par /login
//       if (session && xsrf) {
//         event.locals.session = session;
//         event.locals.xsrf = xsrf;
//         event.cookies.set(session.name, session.value, {
//           path: session.path || '/',
//           httpOnly: session.httpOnly || false,
//           sameSite: session.sameSite || 'lax',
//           secure: session.secure || false,
//           expires: session.expires,
//           domain: session.domain,
//         });
//         event.cookies.set(xsrf.name, xsrf.value, {
//           path: xsrf.path || '/',
//           httpOnly: xsrf.httpOnly || false,
//           sameSite: xsrf.sameSite || 'lax',
//           secure: xsrf.secure || false,
//           expires: xsrf.expires,
//           domain: xsrf.domain,
//         });
//       } else {
//         console.warn('[Signin] No cookies returned by /login');
//       }

//       throw redirect(303, '/dashboard');
//     }

//     return fail(401, { form, message: 'Échec de la connexion' });
//   },
// };



export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(loginSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // Supprimer les cookies existants
    event.cookies.delete(import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session', { path: '/' });
    event.cookies.delete(import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN', { path: '/' });
    event.locals.session = null;
    event.locals.xsrf = null;

    // Régénérer les cookies avant login
    const api = new ApiClient();
    try {
      const { session, xsrf } = await api.fetchCsrfToken(event);
      event.locals.session = session;
      event.locals.xsrf = xsrf;

      // Définir les cookies immédiatement
      event.cookies.set(session.name, session.value, {
        path: session.path || '/',
        httpOnly: session.httpOnly || false,
        sameSite: session.sameSite || 'lax',
        secure: session.secure || false,
        expires: session.expires,
        domain: session.domain,
      });
      event.cookies.set(xsrf.name, xsrf.value, {
        path: xsrf.path || '/',
        httpOnly: xsrf.httpOnly || false,
        sameSite: xsrf.sameSite || 'lax',
        secure: xsrf.secure || false,
        expires: xsrf.expires,
        domain: xsrf.domain,
      });
    } catch (error) {
      console.error('[Signin] Failed to fetch CSRF token:', error);
      return fail(500, { form, message: 'Erreur serveur' });
    }

    // Appeler l’API de login
    const auth = new AuthClient();
    const { response, session, xsrf } = await auth.login(event, form.data);

    if (response.ok) {
      // Stocker les cookies fournis par /login
      if (session && xsrf) {
        event.locals.session = session;
        event.locals.xsrf = xsrf;
        console.log('[Signin] Setting cookies:', { session, xsrf });
        event.cookies.set(session.name, session.value, {
          path: session.path || '/',
          httpOnly: session.httpOnly || false,
          sameSite: session.sameSite || 'lax',
          secure: session.secure || false,
          expires: session.expires,
          domain: null, // Supprimer domain pour éviter localhost
        });
        event.cookies.set(xsrf.name, xsrf.value, {
          path: xsrf.path || '/',
          httpOnly: xsrf.httpOnly || false,
          sameSite: xsrf.sameSite || 'lax',
          secure: xsrf.secure || false,
          expires: xsrf.expires,
          domain: null, // Supprimer domain pour éviter localhost
        });
      } else {
        console.warn('[Signin] No cookies returned by /login');
      }

      // Temporairement retourner une réponse pour tester
      // return { form, message: 'Connexion réussie, cookies définis' };
      throw redirect(303, '/dashboard');
    }

    return fail(401, { form, message: 'Échec de la connexion' });
  },
};