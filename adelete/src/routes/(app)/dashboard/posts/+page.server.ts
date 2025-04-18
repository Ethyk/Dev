// src/routes/dashboard/posts/+page.server.ts
import { ApiClient } from '$lib/sdk/api';
import { AuthClient } from '$lib/sdk/auth'; // Peut être utile pour vérifier l'auth
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { postSchema } from '$lib/schema/schema'; // Ton schéma Zod pour un post
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

// Interface pour les données des posts (adapte selon ton API)
interface Post {
    id: number;
    title: string;
    content: string;
    // ... autres champs
}

export const load: PageServerLoad = async ({ cookies, fetch, depends, locals }) => {
    // Vérifier si l'utilisateur est connecté via le hook
    if (!locals.user) {
        throw redirect(302, '/signin'); // Redirige si pas connecté
    }

    // Assure la revalidation si les données changent
    depends('app:posts');

    // Instancie le client API
    const apiClient = new ApiClient(cookies);

    try {
        console.log('Chargement des posts via ApiClient...');
        // Appelle la méthode GET pour récupérer les posts
        const posts = await apiClient.get<Post[]>('/api/posts', fetch); // Utilise l'instance fetch de l'événement
        console.log(`Nombre de posts chargés: ${posts.length}`);

        // Prépare le formulaire pour la création (si tu as un formulaire sur la page)
        const form = await superValidate(zod(postSchema));

        return {
            posts: posts,
            form: form
         };
    } catch (error: any) {
        console.error("Erreur lors du chargement des posts:", error.message);
        // Retourne une erreur ou un état vide
        return { posts: [], form: await superValidate(zod(postSchema)), error: error.message };
    }
};

export const actions: Actions = {
    // Action pour créer un nouveau post
    createPost: async (event) => {
        const form = await superValidate(event.request, zod(postSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        // Instancie le client API
        const apiClient = new ApiClient(event.cookies);
        const { title, content } = form.data;

        try {
            console.log('Création d\'un nouveau post via ApiClient...');
            // Appelle la méthode POST pour créer le post
            const newPost = await apiClient.post<Post>('/api/posts', { title, content }, event.fetch);
            console.log('Post créé avec succès:', newPost.id);

            // Retourne le formulaire (réinitialisé par superforms) et un message de succès
            // Ou redirige, ou invalide les données pour recharger la liste
            // depends n'est pas dispo ici, utiliser invalidate ou redirect
            // throw redirect(302, '/dashboard/posts'); // Optionnel: rediriger
            return { form, successMessage: `Post "${newPost.title}" créé !` };

        } catch (error: any) {
            console.error("Erreur lors de la création du post:", error.message);
            // Retourne l'erreur au formulaire
             // Ajoute le message d'erreur global au formulaire
             if (error.message.includes('422')) { // Erreur de validation Laravel
                 // Tenter d'extraire les erreurs spécifiques si possible
                 // (nécessite que handleResponse les formate bien)
                 return fail(422, { form, message: "Erreur de validation des données." });
             }
             return fail(500, { form, message: error.message || "Erreur serveur lors de la création." });
        }
    },

    // Action pour supprimer un post
    deletePost: async ({ request, cookies, fetch }) => {
        const formData = await request.formData();
        const postId = formData.get('postId');

        if (!postId || typeof postId !== 'string') {
            return fail(400, { message: "ID du post manquant ou invalide." });
        }

        const apiClient = new ApiClient(cookies);

        try {
            console.log(`Tentative de suppression du post ${postId} via ApiClient...`);
            // Appelle la méthode DELETE
            await apiClient.delete(`/api/posts/${postId}`, fetch);
            console.log(`Post ${postId} supprimé avec succès.`);
            // Retourne un succès (la page devra peut-être être rechargée ou l'UI mise à jour)
            return { success: true, deletedPostId: postId };
        } catch (error: any) {
            console.error(`Erreur lors de la suppression du post ${postId}:`, error.message);
             if (error.message.includes('404')) {
                  return fail(404, { message: `Post ${postId} non trouvé.` });
             }
             if (error.message.includes('403')) {
                  return fail(403, { message: `Vous n'avez pas la permission de supprimer ce post.` });
             }
            return fail(500, { message: error.message || "Erreur serveur lors de la suppression." });
        }
    }
};