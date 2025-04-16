<!-- src/routes/dashboard/posts/+page.svelte -->
<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { postSchema } from '$lib/schema/schema'; // Assure-toi que le chemin est correct
	import { enhance } from '$app/forms'; // Pour progressive enhancement du formulaire de suppression
	import { invalidate } from '$app/navigation'; // Pour recharger les données après action
	import { sineIn } from 'svelte/easing'; // Juste pour un effet visuel optionnel

	// Récupère les données chargées par le serveur (posts, instance de formulaire initialisée)
	let { data }: { data: PageData } = $props();
	// Récupère les données retournées par les actions (utilisé pour la suppression ici)
	let { form: actionData }: { form: ActionData } = $props();

	// Crée l'instance Superforms pour le formulaire de création
	const { form, errors, message, submitting, delayed, enhance: superEnhance } = superForm(data.form, {
		id: 'create-post-form', // ID unique si plusieurs formulaires sur la page
		invalidateAll: false, // N'invalide pas tout par défaut
		resetForm: true, // Réinitialise le formulaire après succès
		taintedMessage: 'Vous avez des modifications non enregistrées. Quitter quand même ?',
		delayMs: 300, // Délai avant que $delayed devienne true
		syncFlashMessage: true, // Synchronise $message avec flash message si utilisé
		onResult({ result }) {
			// Après qu'une action de ce formulaire (createPost) a réussi
			if (result.type === 'success') {
				console.log('Post créé, rechargement de la liste...');
				// Invalide les données 'app:posts' pour déclencher le rechargement via la fonction load
				invalidate('app:posts');
			}
		},
		onError({ result, error }) {
			console.error('Erreur Superforms (createPost):', error);
			// message est déjà mis à jour par Superforms avec result.error.message
		}
	});

	// Réactivité pour la suppression : surveille les données retournées par l'action deletePost
	let posts = $state(data.posts); // Crée une copie locale réactive des posts
	$effect(() => {
		// Si l'action deletePost a retourné un succès avec un deletedPostId
		if (actionData?.success && actionData?.deletedPostId) {
			console.log(`ActionData détecté: Suppression du post ${actionData.deletedPostId}`);
			// Filtre la liste locale des posts pour enlever celui qui a été supprimé
			posts = posts.filter(p => p.id !== actionData?.deletedPostId);
			// Réinitialise actionData pour éviter de refiltrer au prochain rendu
			// (Alternative: utiliser $page.form qui se réinitialise souvent mieux)
			// Ou mieux: utiliser l'invalidation comme pour la création.
		}
		// Met à jour la liste locale si les données de la page changent (ex: après invalidation)
		posts = data.posts;
	});

	// Fonction pour confirmer la suppression
	function confirmDelete(event: Event) {
		const target = event.target as HTMLElement;
		const postTitle = target.dataset.postTitle || 'ce post';
		if (!confirm(`Êtes-vous sûr de vouloir supprimer "${postTitle}" ?`)) {
			event.preventDefault(); // Annule la soumission du formulaire
		}
	}

</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-6">Gestion des Posts</h1>

	{#if data.error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
			<strong class="font-bold">Erreur de chargement:</strong>
			<span class="block sm:inline">{data.error}</span>
		</div>
	{/if}

	<!-- Formulaire de création de Post -->
	<div class="mb-8 p-6 bg-white rounded-lg shadow">
		<h2 class="text-xl font-semibold mb-4">Créer un nouveau Post</h2>
		<form method="POST" action="?/createPost" use:superEnhance class="space-y-4">
			<!-- Affichage des messages globaux (succès/erreur) -->
			{#if $message}
				<div class={`p-3 rounded ${$message.includes('Erreur') || $message.includes('erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} role="alert">
					{$message}
				</div>
			{/if}

			<div>
				<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
				<input
					type="text"
					id="title"
					name="title"
					bind:value={$form.title}
					aria-invalid={$errors.title ? 'true' : undefined}
					class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {$errors.title ? 'border-red-500' : 'border-gray-300'}"
				/>
				{#if $errors.title}
					<p class="text-red-600 text-sm mt-1">{$errors.title}</p>
				{/if}
			</div>

			<div>
				<label for="content" class="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
				<textarea
					id="content"
					name="content"
					bind:value={$form.content}
					rows="4"
					aria-invalid={$errors.content ? 'true' : undefined}
					class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {$errors.content ? 'border-red-500' : 'border-gray-300'}"
				></textarea>
				{#if $errors.content}
					<p class="text-red-600 text-sm mt-1">{$errors.content}</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={$submitting}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
			>
				{#if $submitting}
					<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					{#if $delayed}Envoi...{:else}Chargement...{/if}
				{:else}
					Créer le Post
				{/if}
			</button>
		</form>
	</div>

	<!-- Liste des Posts -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Posts Existants</h2>
		{#if posts && posts.length > 0}
			<ul class="space-y-4">
				{#each posts as post (post.id)}
					<li class="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start"
						in:fly={{ y: 20, duration: 300, easing: sineIn }}
					>
						<div>
							<h3 class="text-lg font-medium text-gray-900">{post.title}</h3>
							<p class="text-gray-600 mt-1">{post.content}</p>
						</div>
						<!-- Formulaire de suppression pour ce post -->
						<form
							method="POST"
							action="?/deletePost"
							use:enhance={() => {
								// Optionnel: Ajoute un feedback pendant la suppression
								return async ({ update }) => {
									// Optimistic UI: Supprime visuellement avant la réponse serveur
									// posts = posts.filter(p => p.id !== post.id);
									// Attends la réponse
									await update();
									// L'effet $effect s'occupera de la mise à jour finale
									// ou l'invalidation si on choisit cette méthode
								};
							}}
							class="ml-4 flex-shrink-0"
						>
							<input type="hidden" name="postId" value={post.id} />
							<button
								type="submit"
								class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
								aria-label={`Supprimer le post ${post.title}`}
								data-post-title={post.title}
								onclick={confirmDelete}
							>
								Supprimer
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else if !data.error}
			<p class="text-gray-500">Aucun post à afficher pour le moment.</p>
		{/if}
	</div>

</div>

<!-- Optionnel: Ajout de styles si non gérés par Tailwind/globalement -->
<style>
	/* Styles spécifiques si nécessaire */
</style>