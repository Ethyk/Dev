import type { RequestEvent } from '@sveltejs/kit';
import cookie from 'cookie';
import setCookieParser from 'set-cookie-parser';
import type { Session, XsrfToken } from '$lib/type';

const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';
const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN';
const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session';

interface ApiOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  resource: string;
  event: RequestEvent;
  data?: Record<string, any> | FormData | null;
}

interface ApiResponse {
  response: Response;
  session?: Session;
  xsrf?: XsrfToken;
}

export class ApiClient {
  async request({ method, resource, event, data }: ApiOptions): Promise<ApiResponse> {
    const url = `${BASE_API}/${resource.replace(/^\//, '')}`;

    // Construire les cookies à partir de event.locals
    const cookies: Record<string, string> = {};
    if (event.locals.xsrf) {
      cookies[XSRF_COOKIE_NAME] = event.locals.xsrf.value;
    }
    if (event.locals.session) {
      cookies[SESSION_COOKIE_NAME] = event.locals.session.value;
    }

    const headers: Record<string, string> = {
      accept: 'application/json',
      cookie: Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    };

    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      headers['content-type'] = 'application/json';
    }

    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
    if (needsCsrf && event.locals.xsrf) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(event.locals.xsrf.value);
    }

    console.log(
      '[ApiClient] headers: ',
      headers,
      'url: ',
      url,
      'body: ',
      headers['content-type'] === 'application/json' ? JSON.stringify(data) : data,
      'locals.xsrf: ',
      event.locals.xsrf,
      'locals.session: ',
      event.locals.session
    );

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
      body: headers['content-type'] === 'application/json' ? JSON.stringify(data) : data,
      credentials: 'include',
    };

    try {
      const response = await event.fetch(url, fetchOptions);
      console.log('[ApiClient] response: ', response);

      // Extraire les cookies de la réponse
      const { session, xsrf } = await this.parseCookies(response);
      return { response, session, xsrf };
    } catch (error) {
      console.error(`[ApiClient] Error fetching ${method} ${url}:`, error);
      const response = new Response(
        JSON.stringify({ message: 'API request failed', error: (error as Error).message }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
      return { response };
    }
  }

  async fetchCsrfToken(event: RequestEvent): Promise<{ session: Session; xsrf: XsrfToken }> {
    const { response, session, xsrf } = await this.request({
      method: 'get',
      resource: 'sanctum/csrf-cookie',
      event,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    if (!session || !xsrf) {
      throw new Error(`Missing session or XSRF cookie. Expected: ${SESSION_COOKIE_NAME}, ${XSRF_COOKIE_NAME}`);
    }

    return { session, xsrf };
  }

  private async parseCookies(response: Response): Promise<{ session?: Session; xsrf?: XsrfToken }> {
    const setCookieHeader = response.headers.get('set-cookie') || '';
    console.log('[ApiClient] setCookieHeader:', setCookieHeader);

    const cookieStrings = setCookieParser.splitCookiesString(setCookieHeader);
    console.log('[ApiClient] cookieStrings:', cookieStrings);

    const cookies = setCookieParser.parse(cookieStrings);
    console.log('[ApiClient] parsed cookies:', cookies);

    const session = cookies.find((c) => c.name === SESSION_COOKIE_NAME);
    const xsrf = cookies.find((c) => c.name === XSRF_COOKIE_NAME);

    const result: { session?: Session; xsrf?: XsrfToken } = {};

    if (session) {
      result.session = {
        name: session.name,
        value: session.value,
        expires: session.expires,
        path: session.path || '/',
        httpOnly: session.httpOnly || false,
        sameSite: (session.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        secure: session.secure || false,
        domain: session.domain,
      };
    }

    if (xsrf) {
      result.xsrf = {
        name: xsrf.name,
        value: xsrf.value,
        expires: xsrf.expires,
        path: xsrf.path || '/',
        httpOnly: xsrf.httpOnly || false,
        sameSite: (xsrf.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        secure: xsrf.secure || false,
        domain: xsrf.domain,
      };
    }

    if (!session || !xsrf) {
      console.warn('[ApiClient] Missing cookies:', { session, xsrf, cookies });
    }

    return result;
  }
}