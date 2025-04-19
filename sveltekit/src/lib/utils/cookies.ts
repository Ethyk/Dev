import type { Cookies } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, XSRF_COOKIE_NAME } from '$lib/api/client';

interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  expires?: Date;
  domain?: string;
}

interface Cookie {
  name: string;
  value: string;
  [key: string]: any;
}

export function setCookies(cookies: Cookie[], eventCookies: Cookies, options: CookieOptions = {}) {
  const defaultOptions: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    secure: false,
    domain: 'localhost',
  };

  cookies.forEach((cookie) => {
    const isSessionCookie = cookie.name === SESSION_COOKIE_NAME;
    eventCookies.set(cookie.name, cookie.value, {
      ...defaultOptions,
      ...options,
      httpOnly: isSessionCookie ? true : options.httpOnly,
      expires: cookie.expires || options.expires,
    });
    console.log(`[Cookies] Set cookie: ${cookie.name}=${cookie.value}`);
  });
}

export function deleteCookies(eventCookies: Cookies) {
  eventCookies.delete(SESSION_COOKIE_NAME, { path: '/', domain: 'localhost' });
  eventCookies.delete(XSRF_COOKIE_NAME, { path: '/', domain: 'localhost' });
  console.log('[Cookies] Deleted cookies: laravel_session, XSRF-TOKEN');
}