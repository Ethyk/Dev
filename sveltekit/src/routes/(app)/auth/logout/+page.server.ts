import { redirect } from '@sveltejs/kit';
import { AuthClient } from '$lib/sdk/auth';

export const actions = {
  default: async (event) => {
    const auth = new AuthClient(event.cookies);
    await auth.logout(event.fetch);
    throw redirect(302, '/'); // Redirige après déconnexion /auth/signin
  }
};
