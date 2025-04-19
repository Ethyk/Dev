// // src/hooks.server.ts
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//   // On récupère le cookie de session envoyé par le navigateur
//   const sessionCookie = event.cookies.get('laravel_session'); // ou le nom de ton cookie de session

//   let user = null;

//   // Si le cookie existe, on tente de récupérer l'utilisateur auprès du backend
//   if (sessionCookie) {
//     try {
//       const res = await fetch('http://localhost:8000/api/user', {
//         headers: {
//           // On transmet tous les cookies reçus à Laravel
//           cookie: event.request.headers.get('cookie') || '',
//           accept: 'application/json',
//           origin: 'http://localhost:5173'
//         },
//         credentials: 'include// src/hooks.server.ts
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//   // On récupère le cookie de session envoyé par le navigateur
//   const sessionCookie = event.cookies.get('laravel_session'); // ou le nom de ton cookie de session

//   let user = null;

//   // Si le cookie existe, on tente de récupérer l'utilisateur auprès du backend
//   if (sessionCookie) {
//     try {
//       const res = await fetch('http://localhost:8000/api/user', {
//         headers: {
//           // On transmet tous les cookies reçus à Laravel
//           cookie: event.request.headers.get('cookie') || '',
//           accept: 'application/json',
//           origin: 'http://localhost:5173'
//         },
//         credentials: 'include'
//       });
//       if (res.ok) {
//         user = await res.json();
//       }
//     } catch (e) {
//       user = null;
//     }
//   }

//   // On stocke l'utilisateur dans event.locals pour qu'il soit accessible partout (load, actions, etc.)
//   event.locals.user = user;

//   console.log("user: ",user);
//   // On continue le traitement normal de la requête
//   return resolve(event);
// };
// '
//       });
//       if (res.ok) {
//         user = await res.json();
//       }
//     } catch (e) {
//       user = null;
//     }
//   }

//   // On stocke l'utilisateur dans event.locals pour qu'il soit accessible partout (load, actions, etc.)
//   event.locals.user = user;

//   console.log("user: ",user);
//   // On continue le traitement normal de la requête
//   return resolve(event);
// };
