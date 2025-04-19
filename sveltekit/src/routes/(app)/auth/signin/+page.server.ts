// src/routes/(app)/auth/signin/+page.server.ts
import { type Actions, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schema/schema'; // Assurez-vous que ce schéma existe
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const form = await superValidate(zod(loginSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(loginSchema));

        if (!form.valid) {
            console.log('Signin Action: Form invalid.', form.errors);
            return fail(400, { form, success: false, message: 'Données invalides.' });
        }

        console.log('Signin Action: Attempting login via API...');
        let loginResponse: Response;
        try {
            loginResponse = await event.fetch(`${PUBLIC_API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form.data),
            });
            console.log(`Signin Action: API response status: ${loginResponse.status}`);
        } catch (error) {
            console.error('Signin Action: API call failed:', error);
            return fail(500, { form, success: false, message: 'Erreur de communication serveur.' });
        }

        if (loginResponse.ok) {
            console.log('Signin Action: Login successful. Redirecting...');
            throw redirect(303, '/dashboard');
        } else {
            console.log(`Signin Action: Login failed. Status: ${loginResponse.status}`);
            let errorMessage = 'Échec de la connexion.';
            const status = loginResponse.status;
            try {
                const errorData = await loginResponse.json();
                errorMessage = errorData.message || errorMessage;
                 if (status === 422 && errorData.errors) {
                    Object.keys(errorData.errors).forEach(field => {
                         if (field in form.data) { //@ts-ignore
                             form.errors[field] = errorData.errors[field];
                         } else { form.message = form.message ? `${form.message}\n${errorData.errors[field]}` : errorData.errors[field]; }
                    });
                 }
            } catch { /* Ignorer l'erreur */ }
            return fail(status, { form, success: false, message: errorMessage });
        }
    },
};