// // src/routes/login/+server.ts
// import { json } from '@sveltejs/kit';

// export const POST = async ({ request, cookies }) => {
//   const { username, password } = await request.json();

//   // Vérifie les identifiants (exemple simplifié)
//   if (username === 'demo' && password === 'secret') {
//     // Génère un token de session (ici un simple exemple)
//     const sessionToken = 'abc123xyz';

//     // Pose le cookie sécurisé
//     cookies.set('session', sessionToken, {
//       httpOnly: true,
//       path: '/',
//       sameSite: 'lax',
//       secure: true,
//       maxAge: 60 * 60 * 24 // 1 jour
//     });

//     return json({ success: true });
//   }

//   return json({ success: false }, { status: 401 });
// };
