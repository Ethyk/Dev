import type { Cookies } from '@sveltejs/kit';

export class AuthClient {
  private baseUrl: string;
  private cookies: Cookies;

  constructor(baseUrl: string, cookies: Cookies) {
    this.baseUrl = baseUrl;
    this.cookies = cookies;
  }


  async login(email: string, password: string): Promise<User> {
    // 1. Récupérer le CSRF cookie
    const csrfRes = await fetch(`${this.baseUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include'
    });
    const setCookie = csrfRes.headers.get('set-cookie');
    if (!setCookie) throw new Error('CSRF cookie manquant');
	const cookies = setCookie
			.split(',')
			.map(cookieStr => cookieStr.split(';')[0].trim())
			.join('; ');
    // 2. Extraire XSRF-TOKEN
    const xsrfMatch = setCookie.match(/XSRF-TOKEN=([^;]+)/);
    if (!xsrfMatch) throw new Error('XSRF-TOKEN manquant');
    const xsrfToken = decodeURIComponent(xsrfMatch[1]);
    // 3. Faire la requête login
    const loginRes = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'X-XSRF-TOKEN': xsrfToken,
            'Cookie': cookies // Important pour transmettre XSRF-TOKEN
        },
        body: JSON.stringify({ email, password })
    });




    

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur login');
    }

    // 4. Récupérer laravel_session dans la réponse
    const setCookieLogin = loginRes.headers.get('set-cookie');
    if (setCookieLogin) {
      const sessionMatch = setCookieLogin.match(/laravel_session=([^;]+)/);
      if (sessionMatch) {
        this.cookies.set('laravel_session', decodeURIComponent(sessionMatch[1]), {
          httpOnly: true,
          secure: false, // true en prod
          sameSite: 'strict',
          path: '/',
        });
      }
    }

    // 5. Retourner l'utilisateur (optionnel)
    return await this.getUser();
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
    //   const xsrfToken = this.cookies.get('XSRF-TOKEN');
    //   if (xsrfToken) {
    //     headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
    //   }

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

    // LOGOUT
    async logout(): Promise<void> {
        // 1. Récupérer le CSRF cookie
        const csrfRes = await fetch(`${this.baseUrl}/sanctum/csrf-cookie`, {
          method: 'GET',
          credentials: 'include'
        });
        const setCookie = csrfRes.headers.get('set-cookie');
        if (!setCookie) throw new Error('CSRF cookie manquant');
    
        const xsrfMatch = setCookie.match(/XSRF-TOKEN=([^;]+)/);
        if (!xsrfMatch) throw new Error('XSRF-TOKEN manquant');
        const xsrfToken = decodeURIComponent(xsrfMatch[1]);
        // 2. Faire la requête logout
        await fetch(`${this.baseUrl}/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrfToken,
                'Cookie': setCookie
            }
        });
        
        this.cookies.delete('laravel_session', { path: '/' });
        this.cookies.delete('XSRF-TOKEN', { path: '/' });
      }
    
}