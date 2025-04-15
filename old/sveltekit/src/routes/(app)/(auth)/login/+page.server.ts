// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';

    // 1. Récupère le cookie CSRF
    await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
      headers: { accept: 'application/json' },
      credentials: 'include'
    });

    // 2. Tente le login
    const res = await fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
        let user = await res.json();
        console.log(user);
        return (user);
      // Le cookie de session est posé par Laravel, rien à faire côté SvelteKit
    //   throw redirect(303, '/dashboard');
    } else {
      return fail(401, { error: 'Identifiants invalides' });
    }
  }
};
