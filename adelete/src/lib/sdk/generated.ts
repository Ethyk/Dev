import type { RequestEvent } from '@sveltejs/kit';
import { ApiClient } from '$lib/api/client';
import { AuthClient } from '$lib/api/auth';
import type { User } from '$lib/types';

export class SDK {
  private api: ApiClient;
  public auth: AuthClient;

  constructor() {
    this.api = new ApiClient();
    this.auth = new AuthClient();
  }

  async getUsers(event: RequestEvent): Promise<User[]> {
    const response = await this.api.request({
      method: 'get',
      resource: 'api/users',
      event,
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  }

  async createUser(event: RequestEvent, data: { name: string; email: string }): Promise<User> {
    const response = await this.api.request({
      method: 'post',
      resource: 'api/users',
      event,
      data,
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return response.json();
  }
}