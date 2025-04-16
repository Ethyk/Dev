import type { Cookies } from '@sveltejs/kit';

export class AuthClient {
  private baseUrl: string;
  private cookies: Cookies;

  constructor(baseUrl: string, cookies: Cookies) {
    this.baseUrl = baseUrl;
    this.cookies = cookies;
  }


  
  async getUser(fetch: typeof globalThis.fetch): Promise<any | null> {
    const sessionCookie = this.cookies.get('laravel_session');
    if (!sessionCookie) {
      console.log('Aucun cookie laravel_session trouvé');
      return null;
    }

    try {
      // Préparer les headers avec le cookie laravel_session
      const headers = new Headers({
        accept: 'application/json',
        cookie: `laravel_session=${sessionCookie}`,
      });

      // Si XSRF-TOKEN est nécessaire, le récupérer
      const xsrfToken = this.cookies.get('XSRF-TOKEN');
      if (xsrfToken) {
        headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
      }

      const response = await fetch(`${this.baseUrl}/api/user`, {
        method: 'GET',
        headers,
        credentials: 'include', // Utile si d'autres cookies doivent être inclus
      });

      if (!response.ok) {
        console.log(`Erreur API: ${response.status} ${response.statusText}`);
        if (response.status === 401 || response.status === 403) {
          console.log('Session invalide, suppression du cookie');
          this.cookies.delete('laravel_session', { path: '/' });
          this.cookies.delete('XSRF-TOKEN', { path: '/' });
        }
        return null;
      }

      const user = await response.json();
      console.log('Utilisateur récupéré :', user);
      return user;
    } catch (e) {
      console.error('Erreur lors de la récupération de l’utilisateur :', e);
      return null;
    }
  }
}