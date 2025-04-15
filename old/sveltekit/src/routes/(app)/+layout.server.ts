import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    console.log("user : ", locals.user);
    return {
        user: locals.user || null
    };
}) satisfies LayoutServerLoad;