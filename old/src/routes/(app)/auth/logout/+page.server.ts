import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { SESSION_COOKIE_NAME, XSRF_COOKIE_NAME } from '$lib/api/client';

export const load = async (event) => {
  console.log('[Logout Load] Checking session for:', event.url.pathname);
  if (!event.locals.user) {
    console.log('[Logout Load] No user, redirecting to signin');
    throw redirect(302, '/auth/signin');
  }
  console.log('[Logout Load] Session valid, user:', event.locals.user.email);
};

export const actions: Actions = {
  default: async (event) => {
    const auth = new AuthClient();
    try {
      // Récupérer le token CSRF avant la déconnexion
      console.log('[Logout] Fetching CSRF token');
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
          console.log(`[Logout] Set cookie from CSRF: ${cookie.name}=${cookie.value}`);
        });
      } else {
        console.log('[Logout] No cookies received from CSRF token request');
      }

      // Vérifier que le token CSRF est défini
      if (!event.locals.xsrfToken) {
        console.error('[Logout] No XSRF-TOKEN available after fetching CSRF');
        return fail(500, { message: 'Erreur: token CSRF manquant' });
      }

      console.log('[Logout] Attempting logout for user:', event.locals.user?.email);
      const { response, cookies } = await auth.logout(event);

      if (response.ok) {
        // Gérer les cookies renvoyés par Laravel (souvent des cookies expirés)
        if (cookies && cookies.length > 0) {
          cookies.forEach((cookie) => {
            event.cookies.set(cookie.name, cookie.value, {
              path: '/',
              httpOnly: cookie.name === SESSION_COOKIE_NAME,
              sameSite: 'lax',
              secure: false,
              expires: cookie.expires,
              domain: 'localhost',
            });
            console.log(`[Logout] Set cookie from logout: ${cookie.name}=${cookie.value}`);
          });
        } else {
          // Si aucun cookie renvoyé, supprimer manuellement
          event.cookies.delete(SESSION_COOKIE_NAME, { path: '/', domain: 'localhost' });
          event.cookies.delete(XSRF_COOKIE_NAME, { path: '/', domain: 'localhost' });
          console.log('[Logout] No cookies received from Laravel, deleted cookies manually');
        }

        // Réinitialiser les locals
        event.locals.user = null;
        event.locals.xsrfToken = null;

        console.log('[Logout] Session invalidated, redirecting to signin');
        throw redirect(303, '/auth/signin');
      }

      console.error('[Logout] Failed to logout:', response.status);
      return fail(response.status, { message: 'Erreur lors de la déconnexion' });
    } catch (error) {
      console.error('[Logout] Failed to logout:', error);
      // Supprimer les cookies en cas d'erreur pour éviter une session orpheline
      event.cookies.delete(SESSION_COOKIE_NAME, { path: '/', domain: 'localhost' });
      event.cookies.delete(XSRF_COOKIE_NAME, { path: '/', domain: 'localhost' });
      event.locals.user = null;
      event.locals.xsrfToken = null;
      console.log('[Logout] Deleted cookies due to error, redirecting to signin');
      throw redirect(303, '/auth/signin');
    }
  },
};