import { redirect } from '@sveltejs/kit';
import { AuthClient } from '$lib/sdk/auth';

export const actions = {
  default: async (event) => {
    const auth = new AuthClient('http://localhost:8000', event.cookies);
    await auth.logout();
    throw redirect(302, '/'); // Redirige après déconnexion /auth/signin
  }
};
