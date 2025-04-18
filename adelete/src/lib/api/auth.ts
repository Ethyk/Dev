import type { RequestEvent } from '@sveltejs/kit';
import { ApiClient } from './client';
import type { User } from '$lib/types';

export class AuthClient {
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
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
    const { response } = await this.api.request({
      method: 'get',
      resource: 'api/user',
      event,
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user as User;
  }
}