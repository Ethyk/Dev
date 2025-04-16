// import type { Handle } from '@sveltejs/kit';
// import { AuthClient } from '$lib/sdk/auth';

// export const handle: Handle = async ({ event, resolve }) => {
//   // Éviter les boucles infinies pour les requêtes API internes
//   if (event.url.pathname.startsWith('/api')) {
//     return resolve(event);
//   }

//   // Initialiser AuthClient avec l'URL de l'API Laravel et les cookies
//   const auth = new AuthClient(event.cookies);
//   const user = await auth.getUser(event.fetch);

//   // Attacher l'utilisateur à event.locals
//   event.locals.user = user;

//   // Continuer le traitement de la requête
//   return resolve(event);
// };

// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { AuthClient, type User } from '$lib/sdk/auth'; // Importer le type User si besoin
import { sequence } from '@sveltejs/kit/hooks'; // Si tu as plusieurs hooks
import { ApiClient } from '$lib/sdk/api';

// Fonction pour gérer l'authentification
const handleAuth: Handle = async ({ event, resolve }) => {
  // Éviter les appels API internes pour ne pas boucler
  // if (event.url.pathname.startsWith('/api')) {
  //   return resolve(event);
  // }

  // Initialiser AuthClient avec les cookies de l'événement
  const auth = new AuthClient(event.cookies);
  // const apiClient = new ApiClient(event.cookies);


  // Tenter de récupérer l'utilisateur en passant event.fetch
  let user: User | null = null;
  try {
    // console.log('Hooks: Tentative de récupération de l\'utilisateur...');
    user = await auth.getUser(event.fetch);
    // user = await apiClient.get<User>('/api/user', event.fetch); // Spécifie le type <User> attendu

    if (user) {
        console.log('Hooks: Utilisateur trouvé:', user.id);
    } else {
        console.log('Hooks: Aucun utilisateur authentifié trouvé.');
    }
  } catch (error) {
     // Ne pas bloquer la requête si la récupération échoue, juste logguer
     console.error('Hooks: Erreur lors de la récupération de l\'utilisateur:', error);
  }

  // Attacher l'utilisateur (ou null) à event.locals
  event.locals.user = user;

  // Continuer le traitement de la requête
  // Ajouter un filtre pour ajouter l'en-tête `Authorization` si nécessaire
  // (Non requis pour Sanctum cookie-based, mais utile si tu mixes avec des tokens API)
  // Le resolve peut aussi modifier la réponse, par ex. pour ajouter des headers
  return resolve(event);
};

export const handle = sequence(handleAuth /*, autres_hooks_si_tu_en_as */);
