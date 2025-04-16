// src/lib/sdk/auth.ts
import type { Cookies } from '@sveltejs/kit';
// Assure-toi d'avoir PUBLIC_API_BASE_URL défini dans ton .env et chargé par SvelteKit
import { PUBLIC_API_BASE_URL } from '$env/static/public';

// Définir un type pour l'utilisateur (adapte selon la structure retournée par ton API)
export type User = {
  id: number;
  name: string;
  email: string;
  // Ajoute d'autres champs si nécessaire (ex: email_verified_at, created_at, etc.)
};

export class AuthClient {
  private baseUrl: string;
  private cookies: Cookies;

  /**
   * Initialise le client d'authentification.
   * @param cookies L'objet Cookies de SvelteKit pour gérer les cookies de session.
   * @param baseUrl L'URL de base de l'API Laravel (optionnel, utilise PUBLIC_API_BASE_URL par défaut).
   */
  constructor(cookies: Cookies, baseUrl: string = PUBLIC_API_BASE_URL) {
    if (!baseUrl) {
      throw new Error("L'URL de base de l'API n'est pas configurée (PUBLIC_API_BASE_URL dans .env)");
    }
    // Supprimer le slash final s'il existe pour éviter les doubles slashs
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cookies = cookies;
  }

  /**
   * Récupère la valeur DÉCODÉE d'un cookie spécifique depuis set-cookie.
   * Utilisé pour l'en-tête X-XSRF-TOKEN.
   * @param setCookieHeader La valeur de l'en-tête 'set-cookie'.
   * @param cookieName Le nom du cookie à chercher.
   * @returns La valeur décodée du cookie ou null si non trouvé.
   */
  private parseDecodedCookieValue(setCookieHeader: string | null | undefined, cookieName: string): string | null {
    if (!setCookieHeader) {
        // Log si l'entrée est vide
        // console.debug(`[AuthClient:parseDecoded] Input header is null/undefined for ${cookieName}.`);
        return null;
    }
    // Log l'entrée (tronquée) pour le debug
    // console.debug(`[AuthClient:parseDecoded] Parsing for ${cookieName} in: "${setCookieHeader.substring(0, 100)}..."`);

    // Utilise split(',') comme dans l'ancien code fonctionnel.
    const cookies = setCookieHeader.split(','); // <<< CORRECTION: Split simple par virgule

    for (let i = 0; i < cookies.length; i++) {
        const cookieStr = cookies[i].trim(); // Enlève les espaces au début/fin de chaque partie
        // Log la partie en cours de traitement
        // console.debug(`[AuthClient:parseDecoded] Processing part ${i}: "${cookieStr.substring(0, 60)}..."`);

        // Extrait la partie nom=valeur (avant le premier ';')
        const cookiePart = cookieStr.split(';')[0].trim(); // Re-trim au cas où

        // Vérifie si la partie commence par le nom du cookie recherché + '='
        if (cookiePart.startsWith(`${cookieName}=`)) {
            // console.debug(`[AuthClient:parseDecoded] Found matching cookie: ${cookieName}`);
            // Extrait la valeur après 'nom='
            const rawValue = cookiePart.substring(cookieName.length + 1);
            // console.debug(`[AuthClient:parseDecoded] Extracted raw value: "${rawValue}"`);
            try {
                // Tente de décoder la valeur
                const decodedValue = decodeURIComponent(rawValue);
                // console.debug(`[AuthClient:parseDecoded] Decoded value: "${decodedValue}"`);
                return decodedValue; // Retourne la valeur décodée
            } catch (e) {
                console.error(`[AuthClient] Erreur lors du décodage de la valeur du cookie ${cookieName} (valeur brute: ${rawValue}):`, e);
                // En cas d'erreur de décodage, retourne la valeur brute pour éviter un échec total
                return rawValue;
            }
        } else {
            // Log si la partie ne correspond pas
            // console.debug(`[AuthClient:parseDecoded] Part ${i} ("${cookiePart}") does not match ${cookieName}`);
        }
    }

    // Log si le cookie n'est pas trouvé après la boucle
    console.warn(`[AuthClient:parseDecoded] Cookie '${cookieName}' non trouvé dans l'en-tête Set-Cookie.`);
    return null; // Retourne null si non trouvé après avoir parcouru toutes les parties
  }


  /**
   * Construit la chaîne pour l'en-tête 'Cookie' en imitant le code original.
   * Prend tous les cookies de Set-Cookie, extrait 'name=value', et les joint avec '; '.
   * @param setCookieHeader La valeur de l'en-tête 'set-cookie'.
   * @returns La chaîne formatée pour l'en-tête 'Cookie', ou une chaîne vide si l'entrée est nulle/vide.
   */
  private buildCookieHeaderFromSetCookie(setCookieHeader: string | null | undefined): string {
      if (!setCookieHeader) return ''; // Retourne vide si pas d'en-tête Set-Cookie
      try {
          // Reproduit la logique: split par ',', map pour extraire 'nom=valeur', filter, join par '; '
          const cookieParts = setCookieHeader
              .split(',') // Attention: peut être fragile si les valeurs/dates contiennent ','
              .map(cookieStr => {
                  // Prend la partie avant le premier ';' et supprime les espaces autour
                  return cookieStr.split(';')[0].trim();
              })
              // Garde seulement les parties qui contiennent bien un '=' (paires nom=valeur)
              .filter(part => part.includes('='))
              // Joint les parties valides avec '; ' comme séparateur
              .join('; ');
          return cookieParts;
      } catch (e) {
          // Log l'erreur et retourne une chaîne vide pour éviter un crash
          console.error("[AuthClient] Erreur lors de la construction de l'en-tête Cookie depuis Set-Cookie:", e);
          return '';
      }
  }


  /**
   * Appelle /sanctum/csrf-cookie pour obtenir les informations CSRF et la chaîne Cookie.
   * @param fetchInstance L'instance `fetch` fournie par SvelteKit.
   * @returns Un objet contenant la valeur décodée du token XSRF (pour l'en-tête X-XSRF-TOKEN)
   *          et la chaîne complète construite pour l'en-tête Cookie.
   * @throws Error si l'appel échoue ou si les informations CSRF essentielles ne sont pas trouvées.
   */
  public async ensureCsrfAndCookies(fetchInstance: typeof fetch): Promise<{ decodedXsrfValue: string | null; cookieHeaderString: string }> {
     console.log('[AuthClient:ensureCsrfAndCookies] Début');
     try {
        const response = await fetchInstance(`${this.baseUrl}/sanctum/csrf-cookie`, {
            method: 'GET',
            credentials: 'include', // Envoie les cookies existants à Laravel
        });
        console.log(`[AuthClient:ensureCsrfAndCookies] Réponse de /sanctum/csrf-cookie: ${response.status}`);
        // Vérifie si la requête a réussi
        if (!response.ok) {
             const errorBody = await response.text().catch(() => ''); // Tente de lire le corps de l'erreur
             console.error(`[AuthClient:ensureCsrfAndCookies] Échec ${response.status}. Corps:`, errorBody);
             throw new Error(`Erreur CSRF: ${response.status}`); // Lance une erreur claire
        }

        // Récupère l'en-tête Set-Cookie de la réponse
        const setCookieHeader = response.headers.get('set-cookie');
        console.log('[AuthClient:ensureCsrfAndCookies] Header Set-Cookie reçu:', setCookieHeader);

        // Extrait la valeur décodée spécifiquement pour l'en-tête X-XSRF-TOKEN
        const decodedXsrfValue = this.parseDecodedCookieValue(setCookieHeader, 'XSRF-TOKEN');
        // Construit l'en-tête Cookie en utilisant TOUS les cookies du Set-Cookie, en imitant l'ancienne logique
        const cookieHeaderString = this.buildCookieHeaderFromSetCookie(setCookieHeader);

        // Log tronqué pour la lisibilité et la sécurité
        console.log('[AuthClient:ensureCsrfAndCookies] Valeur CSRF (décodée pour Header X-XSRF-TOKEN):', decodedXsrfValue ? decodedXsrfValue.substring(0, 30) + '...' : 'NON TROUVÉ');
        console.log('[AuthClient:ensureCsrfAndCookies] Chaîne pour en-tête Cookie (construite):', cookieHeaderString ? cookieHeaderString.substring(0, 50) + '...' : 'VIDE');

        // Important: On ne lance pas d'erreur ici si decodedXsrfValue est null,
        // car cookieHeaderString pourrait être suffisant si le token est dedans.
        // La vérification se fera dans login/logout.

        console.log('[AuthClient:ensureCsrfAndCookies] Terminé.');
        // Retourne les deux informations extraites/construites
        return { decodedXsrfValue, cookieHeaderString };

     } catch (error: any) {
        // Log détaillé de l'erreur
        console.error("[AuthClient:ensureCsrfAndCookies] Exception:", error.message, error.stack);
        // Renvoyer une erreur qui bloque la suite
        if (error instanceof Error && error.message.startsWith('Erreur CSRF')) throw error;
        throw new Error(`Impossible d'obtenir les informations CSRF/Cookie nécessaires: ${error.message}`);
     }
  }

  /**
   * Connecte l'utilisateur via l'endpoint /login de Laravel.
   * @param email L'email de l'utilisateur.
   * @param password Le mot de passe de l'utilisateur.
   * @param fetchInstance L'instance `fetch` fournie par SvelteKit.
   * @returns Les informations de l'utilisateur connecté.
   * @throws Error en cas d'échec de la connexion ou de la récupération CSRF/Cookie.
   */
  async login(email: string, password: string, fetchInstance: typeof fetch): Promise<User> {
    console.log('[AuthClient:login] Début de la connexion pour', email);
    // 1. Récupérer la valeur CSRF décodée ET la chaîne Cookie construite à partir de Set-Cookie
    const { decodedXsrfValue, cookieHeaderString } = await this.ensureCsrfAndCookies(fetchInstance);

    // **Vérifications critiques** avant de continuer :
    // Il faut absolument une valeur pour l'en-tête X-XSRF-TOKEN.
    if (!decodedXsrfValue) {
        console.error("[AuthClient:login] Valeur décodée du XSRF-TOKEN manquante après l'appel CSRF.");
        throw new Error("Impossible de trouver la valeur nécessaire pour X-XSRF-TOKEN.");
    }
    // L'en-tête Cookie construit ne doit pas être vide (il doit au moins contenir le XSRF-TOKEN).
    if (!cookieHeaderString) {
         console.error("[AuthClient:login] L'en-tête Cookie construit est vide après l'appel CSRF.");
         throw new Error("Impossible de construire l'en-tête Cookie nécessaire.");
    }

    console.log('[AuthClient:login] Utilisation de la chaîne Cookie construite:', cookieHeaderString.substring(0, 50) + '...');

    // Note: On N'AJOUTE PAS 'laravel_session' manuellement ici, on utilise strictement
    // ce qui a été retourné et formaté par buildCookieHeaderFromSetCookie.

    // 2. Préparer les Headers pour la requête /login
    const headers = new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': decodedXsrfValue,   // <<< Valeur DÉCODÉE du token
        'Cookie': cookieHeaderString,       // <<< Chaîne CONSTRUITE à partir de Set-Cookie (valeurs brutes/encodées)
        'Origin': 'http://localhost:5173'   // <<< Ton origine frontend SvelteKit (adapte le port si nécessaire)
    });
    console.log('[AuthClient:login] Headers préparés pour /login:');
    // Log des headers (tronqués pour sécurité/lisibilité)
    headers.forEach((value, key) => {
        if (key.toLowerCase() === 'cookie' || key.toLowerCase() === 'x-xsrf-token') {
            console.log(`  ${key}: [Valeur masquée/tronquée: ${value.substring(0, 30)}...]`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    });

    // 3. Faire l'appel fetch à /login
    console.log('[AuthClient:login] Appel fetch vers /login...');
    const response = await fetchInstance(`${this.baseUrl}/login`, {
      method: 'POST',
      // 'include' est important pour que le navigateur/fetch gère correctement
      // les cookies de la *réponse* de /login (comme laravel_session).
      credentials: 'include',
      headers: headers,
      body: JSON.stringify({ email, password }),
    });
    console.log(`[AuthClient:login] Réponse de /login: ${response.status} ${response.statusText}`);

    // 4. Gérer la réponse (erreurs, succès)
    if (!response.ok) {
      console.error('[AuthClient] Échec de la connexion:', response.status, response.statusText);
      let errorBodyText = await response.text(); // Lire le corps pour plus de détails
      console.error('[AuthClient] Corps de la réponse d\'erreur de /login:', errorBodyText);
      let errorMessage = `Erreur de connexion (${response.status})`;
      try {
        const errorBody = JSON.parse(errorBodyText); // Essayer de parser comme JSON
        errorMessage = errorBody.message || (errorBody.errors ? JSON.stringify(errorBody.errors) : errorMessage);
      } catch (e) {
         if (errorBodyText) errorMessage = `${errorMessage}: ${errorBodyText.substring(0, 200)}`; // Utiliser le texte si pas JSON
      }
       // Message spécifique pour 419 CSRF Mismatch
       if (response.status === 419) {
           errorMessage = "Erreur de sécurité (CSRF token mismatch). Veuillez rafraîchir la page et réessayer (419).";
       }
      throw new Error(errorMessage); // Lance l'erreur pour arrêter l'exécution
    }

    // 5. Connexion réussie : gérer le cookie de session reçu en réponse
    console.log('[AuthClient] Connexion réussie. Recherche du cookie laravel_session dans la réponse...');
    const setCookieLoginHeader = response.headers.get('set-cookie');
    // Extrait la valeur décodée du cookie laravel_session
    const sessionValue = this.parseDecodedCookieValue(setCookieLoginHeader, 'laravel_session');
    // console.log("$$$$$",sessionValue);

    if (sessionValue) {
        console.log('[AuthClient] Cookie laravel_session trouvé, stockage dans les cookies SvelteKit...');
        // Stocke le cookie pour les requêtes futures gérées par SvelteKit
        this.cookies.set('laravel_session', sessionValue, {
            path: '/', // Important: doit correspondre au path de Laravel
            httpOnly: true, // Sécurité: le cookie n'est pas accessible en JS côté client
            secure: false , //process.env.NODE_ENV === 'production', // Mettre à true en production (HTTPS)
            sameSite: 'strict', // 'strict' est le plus sûr, 'lax' si nécessaire
            // maxAge: Optionnel: durée de vie en secondes
        });
    } else {
        // Avertissement si le cookie de session n'est pas trouvé après un login réussi
        console.warn('[AuthClient] Aucun cookie laravel_session reçu dans la réponse de /login. La session pourrait ne pas être persistée.');
    }

    // 6. Retourner les informations de l'utilisateur connecté
    console.log('[AuthClient] Récupération des informations utilisateur post-connexion...');
    try {
      // Option 1: Si l'API /login retourne directement les données utilisateur
      const user = await response.json();
      return user as User;

      // Option 2: Appeler /api/user pour obtenir les données utilisateur
      // return await this.getUser(fetchInstance);

    } catch (getUserError: any) {
        console.error("[AuthClient] Erreur lors de la récupération de l'utilisateur après une connexion réussie:", getUserError.message);
        // Lance une erreur pour indiquer que même si la connexion a fonctionné, la récupération user a échoué
        throw new Error(`Connecté avec succès, mais impossible de récupérer les informations utilisateur: ${getUserError.message}`);
    }
  }

  /**
   * Récupère les informations de l'utilisateur actuellement authentifié via /api/user.
   * Utilise le cookie laravel_session qui devrait être géré par SvelteKit/fetch.
   * @param fetchInstance L'instance `fetch` fournie par SvelteKit.
   * @returns Les informations de l'utilisateur ou null si non authentifié ou erreur.
   */
  async getUser(fetchInstance: typeof fetch): Promise<User | null> {
    // Vérifie si le cookie de session existe côté SvelteKit (géré par this.cookies)
    const sessionCookie = this.cookies.get('laravel_session');

    if (!sessionCookie) {
      // Pas de session locale SvelteKit, donc pas authentifié de ce point de vue
      // console.debug('[AuthClient] getUser: Aucun cookie laravel_session trouvé localement.');
      return null;
    }

    // console.debug('[AuthClient] getUser: Tentative de récupération via /api/user avec cookie session local...');
    try {
       // 3. Préparer l'en-tête Cookie manuellement
       const cookieHeader = `laravel_session=${sessionCookie}`;
       console.log(`[AuthClient:getUser] En-tête Cookie préparé: ${cookieHeader.substring(0, 50)}...`); // Log tronqué
 
       // 4. Préparer tous les headers pour la requête fetch
       const headers = new Headers({
           'Accept': 'application/json', // Indique qu'on attend du JSON
           'Cookie': cookieHeader         // <<< AJOUT IMPORTANT: Envoie le cookie de session
           // Pas besoin de X-XSRF-TOKEN pour GET /api/user par défaut
       });
      // Fait l'appel à l'API Laravel pour récupérer l'utilisateur
      const response = await fetchInstance(`${this.baseUrl}/api/user`, {
        method: 'GET',
        // 'include' est essentiel pour que fetch envoie le cookie laravel_session
        // (et potentiellement XSRF si la route GET le requiert, mais normalement non)
        credentials: 'include',
        headers: headers, // Utilise les headers préparés

        // headers: {
        //   'Accept': 'application/json', // Indique qu'on attend du JSON
        //   // Pas besoin de X-XSRF-TOKEN ici par défaut
        //   // Pas besoin de 'Cookie' manuel, 'credentials: include' s'en charge
        // },
      });
      // console.log("dassa", response);
      // Si la réponse est OK (2xx)
      if (response.ok) {
        const user = await response.json(); // Parse les données utilisateur
        console.debug('[AuthClient] getUser: Utilisateur récupéré:', user.id);
        return user as User; // Retourne l'utilisateur (caster au type User)
      }

      // Gérer les réponses non OK (ex: 401 Unauthorized, 403 Forbidden)
      console.log(`[AuthClient] getUser: Réponse non OK (${response.status} ${response.statusText}) de /api/user.`);
      // Si l'erreur est une erreur d'authentification/autorisation, la session est probablement invalide
      if (response.status === 401 || response.status === 403) {
        console.log('[AuthClient] getUser: Session Laravel invalide ou expirée détectée. Nettoyage des cookies locaux SvelteKit.');
        this.clearAuthCookies(); // Supprime le cookie laravel_session local devenu invalide
      }
      return null; // Retourne null car l'utilisateur n'est pas authentifié ou erreur

    } catch (error: any) {
      // Gère les erreurs réseau ou autres exceptions pendant l'appel fetch
      console.error('[AuthClient] getUser: Erreur réseau ou autre lors de l\'appel à /api/user:', error.message);
      return null; // Retourne null en cas d'erreur
    }
  }


  /**
   * Déconnecte l'utilisateur via l'endpoint /logout de Laravel.
   * Applique la même logique que login pour gérer le CSRF et les cookies.
   * @param fetchInstance L'instance `fetch` fournie par SvelteKit.
   * @returns Promise<void>
   */
  async logout(fetchInstance: typeof fetch): Promise<void> {
      console.log('[AuthClient:logout] Début');
      let decodedXsrfValue: string | null = null;
      let cookieHeaderString = ''; // Sera construit à partir de Set-Cookie de l'appel CSRF

      // 1. Essayer d'obtenir les informations CSRF (décodé) et la chaîne Cookie construite
      try {
          // Appelle la fonction qui gère l'appel à /sanctum/csrf-cookie
          const csrfInfo = await this.ensureCsrfAndCookies(fetchInstance);
          decodedXsrfValue = csrfInfo.decodedXsrfValue;
          cookieHeaderString = csrfInfo.cookieHeaderString;
          console.log('[AuthClient:logout] Infos CSRF et chaîne Cookie obtenus.');
      } catch (error: any) {
          // Si l'appel CSRF échoue (ex: session déjà invalide côté serveur), on logue mais on continue
          // car on veut quand même nettoyer les cookies locaux.
          console.warn(`[AuthClient] Logout: Echec ensureCsrfAndCookies (${error.message}). Tentative de continuer le logout local.`);
          // On pourrait essayer de récupérer un token CSRF local s'il existe, mais c'est moins fiable.
      }

       // Tentative d'ajouter le cookie laravel_session local à l'en-tête Cookie
       // Utile si ensureCsrfAndCookies a échoué mais qu'une session existe localement.
       const sessionCookieValue = this.cookies.get('laravel_session');
       if (sessionCookieValue) {
           const sessionPart = `laravel_session=${sessionCookieValue}`;
           // Ajoute seulement si la chaîne cookie existe déjà et ne contient pas déjà la session
           if (cookieHeaderString && !cookieHeaderString.includes(sessionPart)) {
               cookieHeaderString += '; ' + sessionPart;
                console.log('[AuthClient:logout] Cookie laravel_session local ajouté à la chaîne construite.');
           } else if (!cookieHeaderString) { // Si ensureCsrf a échoué, on crée le header avec juste la session
                cookieHeaderString = sessionPart;
                console.log('[AuthClient:logout] Utilisation du cookie laravel_session local seul pour l\'en-tête Cookie.');
           }
       } else {
            console.log("[AuthClient:logout] Pas de cookie laravel_session local à ajouter.");
       }

       console.log('[AuthClient:logout] En-tête Cookie FINAL préparé:', cookieHeaderString ? cookieHeaderString.substring(0, 50) + '...' : 'VIDE');


      // 2. Faire l'appel serveur à /logout (seulement si on a un token CSRF décodé et un en-tête Cookie)
      //    Un token CSRF est généralement requis pour les requêtes POST protégées.
      if (decodedXsrfValue && cookieHeaderString) {
          console.log('[AuthClient:logout] Appel fetch vers /logout...');
          try {
              const headers = new Headers({
                  'Accept': 'application/json', // Important pour que Laravel réponde en JSON
                  'X-XSRF-TOKEN': decodedXsrfValue,   // <<< Valeur DÉCODÉE du token
                  'Cookie': cookieHeaderString,       // <<< Chaîne CONSTRUITE (valeurs brutes/encodées)
                  'Origin': 'http://localhost:5173'   // <<< Ton origine frontend
              });
              // Log des headers envoyés (tronqués)
              console.log('[AuthClient:logout] Headers envoyés à /logout:');
                headers.forEach((value, key) => {
                    if (key.toLowerCase() === 'cookie' || key.toLowerCase() === 'x-xsrf-token') {
                        console.log(`  ${key}: [Valeur masquée/tronquée: ${value.substring(0, 30)}...]`);
                    } else { console.log(`  ${key}: ${value}`); }
                });

              // Exécute la requête POST vers /logout
              const response = await fetchInstance(`${this.baseUrl}/logout`, {
                  method: 'POST',
                  credentials: 'include', // Inclure pour la cohérence
                  headers: headers,
              });
              console.log(`[AuthClient:logout] Réponse de /logout: ${response.status}`);
              // Gérer la réponse du serveur (ignorer les erreurs 401/419 car le but est atteint ou non pertinent)
              if (!response.ok && response.status !== 401 && response.status !== 419) {
                  console.error('[AuthClient] Erreur lors de l\'appel serveur /logout:', response.status, response.statusText, await response.text().catch(()=>''));
              }
          } catch (error: any) {
              // Gérer les erreurs réseau pendant l'appel
              console.error("[AuthClient] Erreur réseau lors de l'appel /logout:", error.message);
          }
      } else {
          // Si on n'a pas pu obtenir le CSRF ou construire le cookie, on ne peut pas faire l'appel serveur
          console.warn("[AuthClient] Logout: Informations CSRF ou Cookie manquantes. Appel serveur /logout sauté.");
      }

      // 3. Toujours nettoyer les cookies locaux gérés par SvelteKit, quoi qu'il arrive
      console.log('[AuthClient:logout] Nettoyage final des cookies d\'authentification locaux...');
      this.clearAuthCookies();
  }

  /**
   * Supprime le cookie `laravel_session` géré par SvelteKit.
   */
  clearAuthCookies(): void {
    // Supprime le cookie principal de session côté SvelteKit
    this.cookies.delete('laravel_session', { path: '/' });
    // Optionnel: Tenter de supprimer XSRF-TOKEN géré localement si besoin.
    // this.cookies.delete('XSRF-TOKEN', { path: '/' });
    console.log('[AuthClient] Cookie local laravel_session supprimé.');
  }

} // Fin de la classe AuthClient