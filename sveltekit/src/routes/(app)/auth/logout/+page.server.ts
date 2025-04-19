import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { AuthClient } from '$lib/api/auth';
import { setCookies, deleteCookies } from '$lib/utils/cookies';

export const load = async (event) => {
  if (!event.locals.user) {
    console.log('[Logout] No user, redirecting to signin');
    throw redirect(302, '/auth/signin');
  }
  console.log('[Logout] Session valid, user:', event.locals.user.email);
};

export const actions: Actions = {
  default: async (event) => {
    const auth = new AuthClient();
    try {
      console.log('[Logout] Attempting logout for user:', event.locals.user?.email);
      const { response, cookies } = await auth.logout(event);

      if (response.ok) {
        if (cookies && cookies.length > 0) {
          setCookies(cookies, event.cookies);
        } else {
          deleteCookies(event.cookies);
        }
        event.locals.user = null;
        event.locals.xsrfToken = null;
        console.log('[Logout] Session invalidated, redirecting to signin');
        throw redirect(303, '/auth/signin');
      }

      console.error('[Logout] Failed to logout:', response.status);
      deleteCookies(event.cookies);
      event.locals.user = null;
      event.locals.xsrfToken = null;
      throw redirect(303, '/auth/signin');
    } catch (error) {
      console.error('[Logout] Failed to logout:', error);
      deleteCookies(event.cookies);
      event.locals.user = null;
      event.locals.xsrfToken = null;
      console.log('[Logout] Deleted cookies due to error, redirecting to signin');
      throw redirect(303, '/auth/signin');
    }
  },
};