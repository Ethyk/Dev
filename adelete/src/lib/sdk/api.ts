// src/lib/sdk/api.ts
import type { Cookies } from '@sveltejs/kit';
import { AuthClient } from './auth'; // Importe AuthClient
import { PUBLIC_API_BASE_URL } from '$env/static/public';

export class ApiClient {
  private baseUrl: string;
  private cookies: Cookies;
  private authClient: AuthClient; // Instance de AuthClient pour réutiliser sa logique

  /**
   * Initialise le client API générique.
   * @param cookies L'objet Cookies de SvelteKit.
   * @param baseUrl L'URL de base de l'API (optionnel, utilise l'env var).
   */
  constructor(cookies: Cookies, baseUrl: string = PUBLIC_API_BASE_URL) {
    if (!baseUrl) {
      throw new Error("L'URL de base de l'API n'est pas configurée (PUBLIC_API_BASE_URL)");
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cookies = cookies;
    // Crée une instance de AuthClient pour accéder à ses méthodes (notamment pour CSRF)
    this.authClient = new AuthClient(cookies, baseUrl);
  }

  /**
   * Prépare les en-têtes nécessaires pour une requête API.
   * Gère l'ajout automatique de 'Accept', 'Content-Type', 'Cookie' (avec laravel_session)
   * et ajoute 'X-XSRF-TOKEN' + le cookie CSRF correspondant pour les méthodes qui modifient l'état.
   * @param method La méthode HTTP de la requête (GET, POST, PUT, etc.).
   * @param fetchInstance L'instance fetch de SvelteKit.
   * @returns L'objet Headers configuré.
   * @throws Error si la récupération CSRF échoue pour les méthodes concernées.
   */
  private async prepareHeaders(method: string, fetchInstance: typeof fetch): Promise<Headers> {
    const headers = new Headers({
      'Accept': 'application/json', // On attend généralement du JSON
    });

    // Détermine si c'est une méthode qui nécessite un corps JSON
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    if (methodsWithBody.includes(method.toUpperCase())) {
      headers.set('Content-Type', 'application/json');
    }

    // Récupère le cookie de session local
    const sessionCookieValue = this.cookies.get('laravel_session');
    let cookieHeader = sessionCookieValue ? `laravel_session=${sessionCookieValue}` : '';

    // Vérifie si un token CSRF est nécessaire (méthodes modifiant l'état)
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (stateChangingMethods.includes(method.toUpperCase())) {
      console.log(`[ApiClient:prepareHeaders] Méthode ${method} nécessite CSRF. Appel à ensureCsrfAndCookies...`);
      try {
        // Utilise la méthode (maintenant publique) de AuthClient
        const { decodedXsrfValue, cookieHeaderString: csrfCookiePart } = await this.authClient.ensureCsrfAndCookies(fetchInstance);

        if (!decodedXsrfValue) {
          throw new Error("Valeur XSRF-TOKEN décodée manquante.");
        }
        if (!csrfCookiePart.includes('XSRF-TOKEN=')) {
             // Vérification supplémentaire que la partie brute contient bien le token
             throw new Error("La chaîne cookie construite ne contient pas XSRF-TOKEN.");
        }

        // Ajoute l'en-tête X-XSRF-TOKEN
        headers.set('X-XSRF-TOKEN', decodedXsrfValue);
        console.log('[ApiClient:prepareHeaders] Header X-XSRF-TOKEN ajouté.');

        // Ajoute la partie cookie CSRF (brute) à l'en-tête Cookie existant
        // (qui contient déjà laravel_session s'il existe)
        // Assure-toi que la partie CSRF n'est pas déjà incluse par erreur
        if (!cookieHeader.includes(csrfCookiePart.split(';')[0])) { // Vérifie le nom=valeur du XSRF
             cookieHeader += (cookieHeader ? '; ' : '') + csrfCookiePart; // Ajoute avec séparateur
             console.log('[ApiClient:prepareHeaders] Partie cookie CSRF ajoutée à l\'en-tête Cookie.');
        }

      } catch (error: any) {
         console.error("[ApiClient:prepareHeaders] Échec de l'obtention/ajout du token CSRF:", error.message);
         // Relance l'erreur pour bloquer la requête API
         throw new Error(`Impossible d'obtenir les informations CSRF nécessaires pour ${method}: ${error.message}`);
      }
    }

    // Définit l'en-tête Cookie final (contient session et potentiellement CSRF)
    if (cookieHeader) {
        headers.set('Cookie', cookieHeader);
        console.log(`[ApiClient:prepareHeaders] En-tête Cookie final défini: ${cookieHeader.substring(0,50)}...`);
    } else {
         console.log(`[ApiClient:prepareHeaders] Aucun cookie (session ou CSRF) à envoyer.`);
    }

    // Optionnel: Ajouter l'en-tête Origin si nécessaire (comme dans AuthClient)
    headers.set('Origin', 'http://localhost:5173'); // Adapte le port si besoin

    return headers;
  }

  /**
   * Gère la réponse d'une requête API.
   * Vérifie le statut, parse le JSON, gère les cas spécifiques (204) et les erreurs.
   * @param response L'objet Response reçu de fetch.
   * @returns La donnée parsée (ou null pour 204).
   * @throws Error en cas de réponse non OK ou d'erreur de parsing.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Cas succès sans contenu (ex: DELETE)
    if (response.status === 204) {
        console.log(`[ApiClient:handleResponse] Réponse ${response.status} No Content reçue.`);
        return null as T; // Retourne null ou une valeur appropriée
    }

    // Si la réponse n'est pas OK (status >= 400)
    if (!response.ok) {
      console.error(`[ApiClient:handleResponse] Erreur API reçue: ${response.status} ${response.statusText} pour ${response.url}`);
      let errorMessage = `Erreur API (${response.status})`;
      let errorBody: any = null;
      try {
        // Tente de lire et parser le corps de l'erreur
        const errorBodyText = await response.text();
        console.error('[ApiClient:handleResponse] Corps de l\'erreur:', errorBodyText);
        errorBody = JSON.parse(errorBodyText);
        errorMessage = errorBody.message || (errorBody.errors ? JSON.stringify(errorBody.errors) : errorMessage);
      } catch (e) {
         console.warn('[ApiClient:handleResponse] Impossible de parser le corps de l\'erreur comme JSON.');
         // Utiliser response.statusText si disponible
         if(response.statusText) errorMessage += `: ${response.statusText}`;
      }

      // Gestion spécifique des codes d'erreur courants
      if (response.status === 401 || response.status === 403) {
          console.warn(`[ApiClient:handleResponse] Accès non autorisé ou interdit (${response.status}). Vérifier la session/permissions.`);
          // On pourrait vouloir invalider la session locale ici si 401
          if (response.status === 401) {
              // this.authClient.clearAuthCookies(); // Possible, mais attention aux effets de bord
          }
      } else if (response.status === 419) {
          console.warn(`[ApiClient:handleResponse] Erreur CSRF (419). Le token a expiré ou est invalide.`);
          errorMessage = "Erreur de sécurité (CSRF). Veuillez rafraîchir la page et réessayer (419).";
      } else if (response.status === 422) {
           console.warn(`[ApiClient:handleResponse] Erreur de validation (422).`);
           // L'erreur détaillée est souvent dans errorBody.errors
           errorMessage = `Erreur de validation (${response.status}): ${errorBody?.message || JSON.stringify(errorBody?.errors)}`;
      }

      throw new Error(errorMessage); // Lance l'erreur pour être gérée par l'appelant
    }

    // Si la réponse est OK (status 200-299, hors 204)
    try {
      // Tente de parser le corps comme JSON
      const data = await response.json();
      return data as T; // Retourne les données parsées
    } catch (e) {
      console.error("[ApiClient:handleResponse] Impossible de parser la réponse JSON malgré un statut OK.", e);
      throw new Error("Réponse invalide du serveur (erreur de parsing JSON).");
    }
  }

  // --- Méthodes publiques pour les requêtes ---

  /**
   * Effectue une requête GET.
   * @param endpoint Le chemin de l'API (ex: '/api/users').
   * @param fetchInstance L'instance fetch de SvelteKit.
   */
  async get<T>(endpoint: string, fetchInstance: typeof fetch): Promise<T> {
    const headers = await this.prepareHeaders('GET', fetchInstance);
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`; // Construit l'URL complète
    console.log(`[ApiClient] GET ${url}`);
    const response = await fetchInstance(url, {
      method: 'GET',
      credentials: 'include', // Important pour la gestion des cookies de réponse
      headers,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Effectue une requête POST.
   * @param endpoint Le chemin de l'API.
   * @param body Les données à envoyer dans le corps de la requête.
   * @param fetchInstance L'instance fetch de SvelteKit.
   */
  async post<T>(endpoint: string, body: unknown, fetchInstance: typeof fetch): Promise<T> {
    const headers = await this.prepareHeaders('POST', fetchInstance);
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    console.log(`[ApiClient] POST ${url}`);
    const response = await fetchInstance(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body), // Sérialise le corps en JSON
    });
    return this.handleResponse<T>(response);
  }

   /**
   * Effectue une requête PUT.
   * @param endpoint Le chemin de l'API.
   * @param body Les données à envoyer.
   * @param fetchInstance L'instance fetch de SvelteKit.
   */
   async put<T>(endpoint: string, body: unknown, fetchInstance: typeof fetch): Promise<T> {
        const headers = await this.prepareHeaders('PUT', fetchInstance);
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        console.log(`[ApiClient] PUT ${url}`);
        const response = await fetchInstance(url, {
            method: 'PUT',
            credentials: 'include',
            headers,
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    /**
   * Effectue une requête DELETE.
   * @param endpoint Le chemin de l'API.
   * @param fetchInstance L'instance fetch de SvelteKit.
   */
    async delete<T>(endpoint: string, fetchInstance: typeof fetch): Promise<T> {
        const headers = await this.prepareHeaders('DELETE', fetchInstance);
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        console.log(`[ApiClient] DELETE ${url}`);
        const response = await fetchInstance(url, {
            method: 'DELETE',
            credentials: 'include',
            headers,
        });
        // handleResponse gère le cas 204 No Content
        return this.handleResponse<T>(response);
    }

   /**
   * Effectue une requête PATCH.
   * @param endpoint Le chemin de l'API.
   * @param body Les données partielles à envoyer.
   * @param fetchInstance L'instance fetch de SvelteKit.
   */
   async patch<T>(endpoint: string, body: unknown, fetchInstance: typeof fetch): Promise<T> {
        const headers = await this.prepareHeaders('PATCH', fetchInstance);
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        console.log(`[ApiClient] PATCH ${url}`);
        const response = await fetchInstance(url, {
            method: 'PATCH',
            credentials: 'include',
            headers,
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

} // Fin de la classe ApiClient