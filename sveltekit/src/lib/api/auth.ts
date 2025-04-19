import type { RequestEvent } from '@sveltejs/kit';
import { ApiClient } from './client';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export class AuthClient {
  private api: ApiClient;

  constructor(api: ApiClient = new ApiClient()) {
    this.api = api;
  }

  async ensureCsrfToken(event: RequestEvent): Promise<void> {
    if (!event.locals.xsrfToken) {
      console.log('[AuthClient] Fetching CSRF token');
      const { cookies } = await this.api.fetchCsrfToken(event);
      if (cookies) {
        console.log('[AuthClient] CSRF token fetched');
      } else {
        console.warn('[AuthClient] No cookies received from CSRF token request');
      }
    } else {
      console.log('[AuthClient] CSRF token already exists');
    }
  }

  async login(event: RequestEvent, data: { email: string; password: string }) {
    await this.ensureCsrfToken(event);
    console.log('[AuthClient] Attempting login:', data.email);
    return await this.api.request({
      method: 'post',
      resource: 'login',
      event,
      data,
    });
  }

  async logout(event: RequestEvent) {
    await this.ensureCsrfToken(event);
    console.log('[AuthClient] Attempting logout');
    return await this.api.request({
      method: 'post',
      resource: 'logout',
      event,
    });
  }

  async getUser(event: RequestEvent) {
    console.log('[AuthClient] Fetching user');
    const result = await this.api.request({
      method: 'get',
      resource: 'api/user',
      event,
    });
    console.log('[AuthClient] User fetch status:', result.response.status);
    return result;
  }
}