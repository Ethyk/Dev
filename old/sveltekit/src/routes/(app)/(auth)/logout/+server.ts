// src/routes/logout/+server.ts
import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies }) => {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';
  await fetch(`${apiUrl}/api/logout`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    credentials: 'include'
  });
  throw redirect(303, '/login');
};
