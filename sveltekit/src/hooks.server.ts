import type { Handle } from '@sveltejs/kit';
import { AuthClient } from '$lib/sdk/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Éviter les boucles infinies pour les requêtes API internes
  if (event.url.pathname.startsWith('/api')) {
    return resolve(event);
  }

  // Initialiser AuthClient avec l'URL de l'API Laravel et les cookies
  const auth = new AuthClient('http://localhost:8000', event.cookies);
  const user = await auth.getUser(event.fetch);

  // Attacher l'utilisateur à event.locals
  event.locals.user = user;

  // Continuer le traitement de la requête
  return resolve(event);
};