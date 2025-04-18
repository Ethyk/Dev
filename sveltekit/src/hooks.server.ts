import type { Handle } from '@sveltejs/kit';
import { AuthClient } from '$lib/api/auth';
import { ApiClient, SESSION_COOKIE_NAME, XSRF_COOKIE_NAME } from '$lib/api/client';
import cookie from 'cookie';

export const handle: Handle = async ({ event, resolve }) => {
  const api = new ApiClient();
  const auth = new AuthClient();

  // Initialiser event.locals
  event.locals.session = null;
  event.locals.xsrf = null;
  event.locals.user = null;

  // Récupérer les cookies de la requête
  const cookies = cookie.parse(event.request.headers.get('cookie') || '');
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  const xsrfCookie = cookies[XSRF_COOKIE_NAME];

  try {
    if (!sessionCookie || !xsrfCookie) {
      console.log('[Hooks] Missing cookies, fetching new ones');
      const { session, xsrf } = await api.fetchCsrfToken(event);
      event.locals.session = session;
      event.locals.xsrf = xsrf;
      ApiClient.setCookies(event, session, xsrf);
    } else {
      console.log('[Hooks] Using existing cookies');
      event.locals.session = {
        name: SESSION_COOKIE_NAME,
        value: sessionCookie,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      };
      event.locals.xsrf = {
        name: XSRF_COOKIE_NAME,
        value: xsrfCookie,
        path: '/',
        sameSite: 'lax',
      };
    }

    // Vérifier l'utilisateur si les cookies sont présents
    if (event.locals.session && event.locals.xsrf && !event.locals.user) {
      event.locals.user = await auth.getUser(event);
    }
  } catch (error) {
    console.error('[Hooks] Failed to initialize session:', error);
  }

  return await resolve(event);
};