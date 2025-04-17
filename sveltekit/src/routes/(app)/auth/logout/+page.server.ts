import { redirect } from '@sveltejs/kit';
import { AuthClient } from '$lib/sdk/auth';
import { api } from '../../../api';

export const actions = {
  default: async (event) => {
    // const auth = new AuthClient(event.cookies);
    // await auth.logout(event.fetch);
    const response = await api({
          method: 'post',
          resource: 'logout',
          data: null,
          // data: {
          // 	'email': email ??  undefined,
          // 	'password': password ??  undefined,
          // },
          event,
    });
    // console.log("res",response);
    // console.log("eve",event);
		console.log("response : ", await response.json());

    throw redirect(302, '/'); // Redirige après déconnexion /auth/signin
  }
};
