import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import { z } from 'zod';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { SESSION_COOKIE_NAME, XSRF_COOKIE_NAME } from '$lib/api/client';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

export const load = async (event) => {
  const auth = new AuthClient();
  try {
    console.log('[Signin] Fetching CSRF token on load');
    const csrfResult = await auth.fetchCsrfToken(event);
    if (csrfResult.cookies) {
      csrfResult.cookies.forEach((cookie) => {
        event.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: cookie.name === SESSION_COOKIE_NAME,
          sameSite: 'lax',
          secure: false,
          expires: cookie.expires,
          domain: 'localhost',
        });
        console.log(`[Signin] Set cookie on load: ${cookie.name}=${cookie.value}`);
      });
    } else {
      console.log('[Signin] No cookies received from CSRF token request on load');
    }
  } catch (error) {
    console.error('[Signin] Failed to fetch CSRF token on load:', error);
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
      console.log('[Signin] Fetching CSRF token');
      const csrfResult = await auth.fetchCsrfToken(event);
      if (csrfResult.cookies) {
        csrfResult.cookies.forEach((cookie) => {
          event.cookies.set(cookie.name, cookie.value, {
            path: '/',
            httpOnly: cookie.name === SESSION_COOKIE_NAME,
            sameSite: 'lax',
            secure: false,
            expires: cookie.expires,
            domain: 'localhost',
          });
          console.log(`[Signin] Set cookie: ${cookie.name}=${cookie.value}`);
        });
      } else {
        console.log('[Signin] No cookies received from CSRF token request');
      }

      console.log('[Signin] Attempting login:', form.data.email);
      const { response, cookies } = await auth.login(event, form.data);
      if (response.status === 419) {
        console.log('[Signin] CSRF mismatch, retrying with new token');
        const retryCsrfResult = await auth.fetchCsrfToken(event);
        if (retryCsrfResult.cookies) {
          retryCsrfResult.cookies.forEach((cookie) => {
            event.cookies.set(cookie.name, cookie.value, {
              path: '/',
              httpOnly: cookie.name === SESSION_COOKIE_NAME,
              sameSite: 'lax',
              secure: false,
              expires: cookie.expires,
              domain: 'localhost',
            });
            console.log(`[Signin] Set cookie after retry: ${cookie.name}=${cookie.value}`);
          });
        }
        const retry = await auth.login(event, form.data);
        if (retry.cookies) {
          retry.cookies.forEach((cookie) => {
            event.cookies.set(cookie.name, cookie.value, {
              path: '/',
              httpOnly: cookie.name === SESSION_COOKIE_NAME,
              sameSite: 'lax',
              secure: false,
              expires: cookie.expires,
              domain: 'localhost',
            });
            console.log(`[Signin] Set cookie after login retry: ${cookie.name}=${cookie.value}`);
          });
        }
        if (!retry.response.ok) {
          console.error('[Signin] Login failed after retry:', retry.response.status);
          return fail(401, { form, message: 'Email ou mot de passe incorrect' });
        }
        event.locals.user = await retry.response.json();
      } else if (!response.ok) {
        console.error('[Signin] Login failed:', response.status);
        return fail(401, { form, message: 'Email ou mot de passe incorrect' });
      } else {
        if (cookies) {
          cookies.forEach((cookie) => {
            event.cookies.set(cookie.name, cookie.value, {
              path: '/',
              httpOnly: cookie.name === SESSION_COOKIE_NAME,
              sameSite: 'lax',
              secure: false,
              expires: cookie.expires,
              domain: 'localhost',
            });
            console.log(`[Signin] Set cookie after login: ${cookie.name}=${cookie.value}`);
          });
        }
        event.locals.user = await response.json();
      }
    } catch (error) {
      console.error('[Signin] Login failed:', error);
      return fail(401, { form, message: 'Email ou mot de passe incorrect' });
    }

    console.log('[Signin] Login successful, redirecting to /dashboard');
    throw redirect(303, '/dashboard');
  },
};