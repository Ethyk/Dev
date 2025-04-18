import type { RequestEvent } from '@sveltejs/kit';
import cookie from 'cookie';
import setCookieParser from 'set-cookie-parser';
import type { Session, XsrfToken } from '$lib/type';

// Constantes
export const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';
export const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN';
export const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session';

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
  static setCookies(event: RequestEvent, session: Session, xsrf: XsrfToken): void {
    event.cookies.set(session.name, session.value, {
      path: session.path || '/',
      httpOnly: session.httpOnly ?? true,
      sameSite: session.sameSite ?? 'lax',
      secure: session.secure ?? false,
      expires: session.expires,
      domain: session.domain || undefined,
    });
    event.cookies.set(xsrf.name, xsrf.value, {
      path: xsrf.path || '/',
      httpOnly: xsrf.httpOnly ?? false,
      sameSite: xsrf.sameSite ?? 'lax',
      secure: xsrf.secure ?? false,
      expires: xsrf.expires,
      domain: xsrf.domain || undefined,
    });
  }

  async request({ method, resource, event, data }: ApiOptions): Promise<ApiResponse> {
    const url = `${BASE_API}/${resource.replace(/^\//, '')}`;
    const cookies: Record<string, string> = {};

    if (event.locals.xsrf) cookies[XSRF_COOKIE_NAME] = event.locals.xsrf.value;
    if (event.locals.session) cookies[SESSION_COOKIE_NAME] = event.locals.session.value;

    const headers: Record<string, string> = {
      accept: 'application/json',
      cookie: Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; '),
    };

    if (data && !(data instanceof FormData)) {
      headers['content-type'] = 'application/json';
    }

    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
    if (needsCsrf && event.locals.xsrf) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(event.locals.xsrf.value);
    }

    const requestId = crypto.randomUUID();
    console.log(`[ApiClient] Request [${requestId}]:`, { method, url, headers, body: data });
    // console.log('[ApiClient] Request:', { method, url, headers, body: data });

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
      body: headers['content-type'] === 'application/json' ? JSON.stringify(data) : data,
      credentials: 'include',
    };

    try {
      const response = await event.fetch(url, fetchOptions);
      console.log('[ApiClient] Response:', { status: response.status, url });

      const { session, xsrf } = await this.parseCookies(response);
      return { response, session, xsrf };
    } catch (error) {
      console.error('[ApiClient] Request failed:', error);
      return {
        response: new Response(
          JSON.stringify({ message: 'API request failed', error: (error as Error).message }),
          { status: 503, headers: { 'content-type': 'application/json' } }
        ),
      };
    }
  }

  async fetchCsrfToken(event: RequestEvent): Promise<{ session: Session; xsrf: XsrfToken }> {
    const { response, session, xsrf } = await this.request({
      method: 'get',
      resource: 'sanctum/csrf-cookie',
      event,
    });

    if (!response.ok || !session || !xsrf) {
      throw new Error('Failed to fetch CSRF token or missing cookies');
    }

    return { session, xsrf };
  }

  private async parseCookies(response: Response): Promise<{ session?: Session; xsrf?: XsrfToken }> {
    const setCookieHeader = response.headers.get('set-cookie') || '';
    const cookies = setCookieParser.parse(setCookieParser.splitCookiesString(setCookieHeader));

    const session = cookies.find((c) => c.name === SESSION_COOKIE_NAME);
    const xsrf = cookies.find((c) => c.name === XSRF_COOKIE_NAME);

    console.log('[ApiClient] Parsed cookies:', { session: !!session, xsrf: !!xsrf });

    return {
      session: session && {
        name: session.name,
        value: session.value,
        expires: session.expires,
        path: session.path || '/',
        httpOnly: session.httpOnly ?? true,
        sameSite: (session.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        secure: session.secure ?? false,
      },
      xsrf: xsrf && {
        name: xsrf.name,
        value: xsrf.value,
        expires: xsrf.expires,
        path: xsrf.path || '/',
        httpOnly: xsrf.httpOnly ?? false,
        sameSite: (xsrf.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        secure: xsrf.secure ?? false,
      },
    };
  }
}