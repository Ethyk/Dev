import type { RequestEvent } from '@sveltejs/kit';
import { ApiClient } from './client';

export class AuthClient {
  private api: ApiClient;

  constructor(api: ApiClient = new ApiClient()) {
    this.api = api;
  }

  async fetchCsrfToken(event: RequestEvent): Promise<{ cookies?: Array<{ name: string; value: string; [key: string]: any }> }> {
    console.log('[AuthClient] Fetching CSRF token');
    return await this.api.fetchCsrfToken(event);
  }

  async login(event: RequestEvent, data: { email: string; password: string }) {
    console.log('[AuthClient] Attempting login:', data.email);
    return await this.api.request({
      method: 'post',
      resource: 'login',
      event,
      data,
    });
  }

  async logout(event: RequestEvent) {
    console.log('[AuthClient] Attempting logout');
    return await this.api.request({
      method: 'post',
      resource: 'logout',
      event,
    });
  }

  async getUser(event: RequestEvent): Promise<{ response: Response; cookies?: Array<{ name: string; value: string; [key: string]: any }> }> {
    try {
      console.log('[AuthClient] Fetching user');
      const result = await this.api.request({
        method: 'get',
        resource: 'api/user',
        event,
      });
      console.log('[AuthClient] User fetch status:', result.response.status);
      return result;
    } catch (error) {
      console.error('[AuthClient] Failed to fetch user:', error);
      throw error;
    }
  }
}