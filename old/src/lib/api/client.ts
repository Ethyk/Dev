import type { RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import setCookieParser from 'set-cookie-parser';

export const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';
export const XSRF_COOKIE_NAME = import.meta.env.VITE_XSRF_COOKIE_NAME || 'XSRF-TOKEN';
export const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME || 'laravel_session';

export interface ApiOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  resource: string;
  event: RequestEvent;
  data?: Record<string, any> | FormData | null;
  schema?: z.ZodType;
}

export interface ApiResponse {
  response: Response;
  cookies?: Array<{ name: string; value: string; [key: string]: any }>;
}

export class ApiClient {
  async request({ method, resource, event, data, schema }: ApiOptions): Promise<ApiResponse> {
    const url = `${BASE_API}/${resource.replace(/^\//, '')}`;
    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    if (data && !(data instanceof FormData)) {
      headers['content-type'] = 'application/json';
    }

    // Ajouter X-XSRF-TOKEN pour les requêtes non-GET si disponible
    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase());
    if (needsCsrf && event.locals.xsrfToken) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(event.locals.xsrfToken);
      console.log(`[ApiClient] Added X-XSRF-TOKEN:`, headers['X-XSRF-TOKEN']);
    } else if (needsCsrf) {
      console.log('[ApiClient] No XSRF-TOKEN available for POST request');
    }

    const requestId = crypto.randomUUID();
    console.log(`[ApiClient] Request [${requestId}]:`, { method, url, headers, body: data });

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
      body: headers['content-type'] === 'application/json' ? JSON.stringify(data) : data,
      credentials: 'include', // Inclut les cookies en CSR
    };

    const response = await event.fetch(url, fetchOptions);

    // Extraire les cookies
    const setCookieHeader = response.headers.get('set-cookie') || '';
    const cookies = setCookieParser.parse(setCookieParser.splitCookiesString(setCookieHeader));

    console.log(`[ApiClient] Response:`, {
      status: response.status,
      url: response.url,
      cookies: setCookieHeader || 'none',
    });

    if (schema) {
      const json = await response.json();
      schema.parse(json);
    }

    return { response, cookies };
  }

  async fetchCsrfToken(event: RequestEvent): Promise<{ cookies?: Array<{ name: string; value: string; [key: string]: any }> }> {
    console.log('[ApiClient] Fetching CSRF token');
    const { response, cookies } = await this.request({
      method: 'get',
      resource: 'sanctum/csrf-cookie',
      event,
    });

    if (!response.ok) {
      console.error('[ApiClient] Failed to fetch CSRF token:', response.status);
      throw new Error('Failed to fetch CSRF token');
    }

    // Stocker XSRF-TOKEN pour les requêtes POST en SSR
    const xsrfCookie = cookies?.find((c) => c.name === XSRF_COOKIE_NAME);
    if (xsrfCookie) {
      event.locals.xsrfToken = xsrfCookie.value;
      console.log(`[ApiClient] Stored XSRF-TOKEN:`, xsrfCookie.value);
    } else {
      console.log('[ApiClient] No XSRF-TOKEN cookie found in response');
    }

    console.log('[ApiClient] CSRF cookies:', cookies?.map((c) => c.name) || 'none');
    return { cookies };
  }
}