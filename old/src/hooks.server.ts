import type { Handle, HandleFetch } from '@sveltejs/kit';
import { AuthClient } from '$lib/api/auth';
import setCookieParser from 'set-cookie-parser';
import { SESSION_COOKIE_NAME, XSRF_COOKIE_NAME } from '$lib/api/client';

export const handle: Handle = async ({ event, resolve }) => {
  console.log('[Hooks] Processing request for URL:', event.url.pathname);
  event.locals.user = null;

  // Ignorer les requêtes API pour éviter les boucles
  if (
    event.url.pathname.startsWith('/api') ||
    event.url.pathname.startsWith('/sanctum') ||
    event.url.pathname === '/login' ||
    event.url.pathname === '/logout'
  ) {
    console.log('[Hooks] Skipping user fetch for API route:', event.url.pathname);
    return await resolve(event);
  }

  const auth = new AuthClient();

  try {
    console.log('[Hooks] Fetching user for:', event.url.pathname);
    const { response, cookies } = await auth.getUser(event);
    event.locals.user = response.ok ? await response.json() : null;

    // Définir les cookies uniquement si aucun cookie de session valide n'existe
    const existingSession = event.cookies.get(SESSION_COOKIE_NAME);
    const existingXsrf = event.cookies.get(XSRF_COOKIE_NAME);
    if (!existingSession || !existingXsrf || !event.locals.user) {
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
          console.log(`[Hooks] Set cookie: ${cookie.name}=${cookie.value}`);
        });
      }
    } else {
      console.log('[Hooks] Skipping cookie set: valid session exists');
    }

    console.log('[Hooks] User fetched:', event.locals.user ? event.locals.user.email : 'null');
  } catch (error) {
    console.error('[Hooks] Failed to fetch user:', error);
  }

  return await resolve(event);
};

export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
  console.log('[HandleFetch] Processing fetch for:', request.url);

  // Transférer les cookies du client pour les requêtes vers Laravel
  const cookie = event.request.headers.get('cookie');
  if (cookie && request.url.includes('localhost:8000')) {
    request.headers.set('cookie', cookie);
    console.log('[HandleFetch] Added client cookies:', cookie);
  } else {
    console.log('[HandleFetch] No client cookies to add for:', request.url);
  }

  const response = await fetch(request);
  console.log('[HandleFetch] Response cookies:', response.headers.get('set-cookie') || 'none');

  return response;
};