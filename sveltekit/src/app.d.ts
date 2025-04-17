// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from "$lib/type";

// Exporter le handle (utiliser sequence si tu as d'autres hooks)
export const handle = sequence(handleAuth /*, autresHooks */);

// Typage pour event.locals (dans src/app.d.ts)
declare global {
	namespace App {
		// interface Locals {
		// 	user: import('$lib/sdk/auth').User | null; // Utiliser le type User importé
		// }
		interface Locals {
			// sveltekit default
			userid: string;

			// laravel sanctum
			user: User;
			session: string;
		}
		interface Session {
			// laravel sanctum
			user: any;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}


export {};


