import type { RequestEvent } from '@sveltejs/kit';
import { ApiClient } from './client';
import type { User } from '$lib/type';

export class AuthClient {
  private api: ApiClient;

  constructor(api: ApiClient = new ApiClient()) {
    this.api = api;
  }

  async login(event: RequestEvent, data: { email: string; password: string }) {
    return await this.api.request({
      method: 'post',
      resource: 'login',
      event,
      data,
    });
  }

  async logout(event: RequestEvent) {
    return await this.api.request({
      method: 'post',
      resource: 'logout',
      event,
    });
  }

  async getUser(event: RequestEvent): Promise<User | null> {
    try {
      const { response } = await this.api.request({
        method: 'get',
        resource: 'api/user',
        event,
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as User;
    } catch (error) {
      console.error('[AuthClient] Failed to fetch user:', error);
      return null;
    }
  }
}