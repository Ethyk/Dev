import type { Cookies } from '@sveltejs/kit';

export class ApiClient {
  private baseUrl: string;
  private cookies: Cookies | null;

  constructor(baseUrl: string, cookies?: Cookies) {
    this.baseUrl = baseUrl;
    this.cookies = cookies;
  }

  // Récupère le cookie CSRF et configure les headers
  private async getCsrfToken(): Promise<{ headers: Headers; cookies: string }> {
    const response = await fetch(`${this.baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du cookie CSRF');
    }

    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
      throw new Error('Cookie CSRF introuvable');
    }

    const cookies = setCookie
      .split(',')
      .map((cookie) => cookie.split(';')[0].trim())
      .join('; ');
    const xsrfMatch = setCookie.match(/XSRF-TOKEN=([^;]+)/);
    const xsrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : '';

    const headers = new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrfToken,
      'Cookie': cookies,
    });

    return { headers, cookies };
  }

  // Méthode générique pour les requêtes
  async request<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    withCsrf: boolean = false
  ): Promise<T> {
    let headers = new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });

    let cookieHeader = this.cookies?.get('laravel_session')
      ? `laravel_session=${this.cookies.get('laravel_session')}`
      : '';

    if (withCsrf) {
      const csrf = await this.getCsrfToken();
      headers = csrf.headers;
      cookieHeader = csrf.cookies;
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return response.json();
  }
}