// src/hooks/auth.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { writable } from 'svelte/store';

export const user = writable(null);

export async function login(email: any, password: any) {
  await fetch('/api/csrf-cookie');
  const response = await fetch('/api/auth/spa/login', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    const userData = await response.json();
    user.set(userData);
  } else {
    throw new Error('Erreur d\'authentification');
  }
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  user.set(null);
  goto('/');
}

if (browser) {
  // Initialisation de l'utilisateur côté client
  login();
}