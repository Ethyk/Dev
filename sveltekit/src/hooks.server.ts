import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Récupérer le cookie de session Laravel
  const sessionCookie = event.cookies.get('laravel_session');

  let user = null;

  if (sessionCookie) {
    try {
      const res = await fetch('http://localhost:8000/api/user', {
        headers: {
          cookie: event.request.headers.get('cookie') || '',
          accept: 'application/json',
          origin: 'http://localhost:5173'
        },
        credentials: 'include'
      });

      if (res.ok) {
        user = await res.json();
      }
    } catch (e) {
      console.error('Erreur lors de la récupération de l’utilisateur :', e);
      user = null;
    }
  }

  // Attacher l'utilisateur à event.locals
  event.locals.user = user;
  // Continuer le traitement normal de la requête
  return resolve(event);
};
