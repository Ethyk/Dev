import type { Handle } from '@sveltejs/kit';
import { AuthClient } from '$lib/api/auth';
import { ApiClient } from '$lib/api/client';
import cookie from 'cookie';
import type { Session, XsrfToken } from '$lib/type';

export const handle: Handle = async ({ event, resolve }) => {
  const api = new ApiClient();
  const auth = new AuthClient();

  // Initialiser event.locals
  event.locals.session = null;
  event.locals.xsrf = null;
  event.locals.user = null;

  // Récupérer les cookies de la requête
  const cookies = cookie.parse(event.request.headers.get('cookie') || '');
  const sessionCookie = cookies[import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session'];
  const xsrfCookie = cookies[import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN'];

  // Régénérer les cookies si laravel_session est absent
  try {
    if (!sessionCookie) {
      console.log('[Hooks] No laravel_session cookie found, fetching new ones');
      const { session, xsrf } = await api.fetchCsrfToken(event);
      event.locals.session = session;
      event.locals.xsrf = xsrf;

      // Définir les cookies
      event.cookies.set(session.name, session.value, {
        path: session.path || '/',
        httpOnly: session.httpOnly || false,
        sameSite: session.sameSite || 'lax',
        secure: session.secure || false,
        expires: session.expires,
        domain: null, // Supprimer domain
      });
      event.cookies.set(xsrf.name, xsrf.value, {
        path: xsrf.path || '/',
        httpOnly: xsrf.httpOnly || false,
        sameSite: xsrf.sameSite || 'lax',
        secure: xsrf.secure || false,
        expires: xsrf.expires,
        domain: null, // Supprimer domain
      });
    } else {
      console.log('[Hooks] Using existing cookies:', { sessionCookie, xsrfCookie });
      event.locals.session = {
        name: import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session',
        value: sessionCookie,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      };
      event.locals.xsrf = xsrfCookie
        ? {
            name: import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN',
            value: xsrfCookie,
            path: '/',
            sameSite: 'lax',
          }
        : null;

      // Si XSRF-TOKEN est absent mais laravel_session est présent, régénérer XSRF-TOKEN
      if (!xsrfCookie && sessionCookie) {
        console.log('[Hooks] No XSRF-TOKEN found, regenerating with existing laravel_session');
        const { xsrf } = await api.fetchCsrfToken(event);
        event.locals.xsrf = xsrf;
        event.cookies.set(xsrf.name, xsrf.value, {
          path: xsrf.path || '/',
          httpOnly: xsrf.httpOnly || false,
          sameSite: xsrf.sameSite || 'lax',
          secure: xsrf.secure || false,
          expires: xsrf.expires,
          domain: null, // Supprimer domain
        });
      }
    }
  } catch (error) {
    console.error('[Hooks] Failed to fetch CSRF token:', error);
  }

  // Vérifier si l’utilisateur est connecté
  event.locals.user = await auth.getUser(event);

  // Résoudre la requête
  return await resolve(event);
};