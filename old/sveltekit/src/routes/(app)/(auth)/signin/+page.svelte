<script lang="ts">
	import GitHubSvg from '$lib/imgs/github-dark.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronLeftIcon } from 'lucide-svelte';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { formSchema } from '$lib/schema/schema';
	import { type SuperValidated, superForm,type FormResult } from 'sveltekit-superforms'; // Importer FormResult
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Loader } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
    import { applyAction, deserialize } from '$app/forms'; // Pour gérer la réponse de l'action
    import { invalidateAll } from '$app/navigation'; // Pour rafraîchir les données (ex: état user)

	export let data;

    let isFormLoading = false; // Garder une variable locale pour l'état de chargement

	let form = superForm(data.form, {
		validators: zodClient(formSchema),
        // Plus besoin de onSubmit personnalisé ici, on utilise l'action serveur par défaut
        onUpdate({ form: currentForm, formElement }) {
            // Gérer l'état de chargement PENDANT la soumission
            isFormLoading = currentForm.submitting;
            console.log("Form state:", currentForm.submitting ? "Submitting..." : "Idle");
        },
        onResult({ result }: { result: FormResult<any> }) {
            // Gérer le résultat APRÈS la soumission
            isFormLoading = false; // Arrêter le chargement
            console.log("Action Result:", result);

            if (result.type === 'success') {
                toast.success($formData.isRegister ? 'Account created!' : 'Logged in successfully!');
                 // Option 1: Redirection programmatique après succès
                // import { goto } from '$app/navigation';
                // goto('/dashboard'); // Redirige vers le tableau de bord

                // Option 2: Juste rafraîchir les données globales (si le hook met à jour locals.user)
                // et laisser le layout/page réagir au changement de locals.user
                invalidateAll(); // Cela va relancer les fonctions load et mettre à jour l'UI si nécessaire

                // Option 3: Si l'action retourne une redirection (voir +page.server.ts)
                // SvelteKit/Superforms s'en chargera automatiquement via applyAction

                // Pour Superforms < 2.0, on pouvait faire applyAction(result); mais ce n'est plus nécessaire normalement.
            } else if (result.type === 'error') {
                toast.error(`Error: ${result.error?.message || 'An error occurred.'}`);
            } else if (result.type === 'failure') {
                // Erreurs de validation gérées automatiquement par Superforms
                // Afficher un message générique si besoin
                 const message = result.data?.message || ($formData.isRegister ? 'Registration failed.' : 'Login failed.');
                 toast.error(message);
                 console.error("Failure Data:", result.data); // Pour voir les détails de l'erreur Laravel
            }
        },
        onError(event) {
             isFormLoading = false; // Assure-toi d'arrêter le chargement en cas d'erreur réseau/JS
             console.error("Submit Error Event:", event);
             toast.error("An unexpected error occurred during submission.");
        }
	});

	const { form: formData, enhance } = form;

	const toggleAuthMode = () => {
        // Garder le $ avant formData pour la réactivité Svelte
		$formData.isRegister = !$formData.isRegister;
		// On ne reset pas les champs ici, Superforms le fera si on change d'action ou recharge
        // $formData.name = '';
	};
</script>

<svelte:head>
	<title>{$formData.isRegister ? 'Sign Up' : 'Sign In'} | Svee UI</title>
	<meta name="description" content="Authentication for Svee UI" />
</svelte:head>

<div class="container flex h-screen w-screen flex-col items-center justify-center">
	<Button variant="ghost" href="/" class="absolute left-4 top-4 md:left-8 md:top-8">
		<ChevronLeftIcon class="mr-2 size-4" />
		Back
	</Button>

	<div class="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
		<div class="flex flex-col gap-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">
				{$formData.isRegister ? 'Create Account' : 'Welcome Back'}
			</h1>
			<p class="text-sm text-muted-foreground">
				{$formData.isRegister
					? 'Register with email and password'
					: 'Sign in to your account'}
			</p>
		</div>

		<!-- Toggle Auth Mode -->
		<div class="flex items-center justify-center gap-2">
			<button
				type="button"
				on:click={toggleAuthMode}
				class="text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				{$formData.isRegister
					? 'Already have an account? Sign In'
					: 'Need an account? Sign Up'}
			</button>
		</div>

		<!-- Formulaire principal - utilise l'action par défaut -->
		<form method="POST" use:enhance class="space-y-4">
            <!-- Champ caché pour savoir si c'est register ou login -->
			<input type="hidden" name="isRegister" bind:value={$formData.isRegister} />

			{#if $formData.isRegister}
				<Form.Field {form} name="name" class="mb-4">
					<Form.Control let:attrs>
						<Input
							placeholder="Your full name"
							{...attrs}
							bind:value={$formData.name}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			<Form.Field {form} name="email" class="mb-4">
				<Form.Control let:attrs>
					<Input
						type="email"
						placeholder="name@example.com"
						{...attrs}
						bind:value={$formData.email}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password" class="mb-4">
				<Form.Control let:attrs>
					<Input
						type="password"
						placeholder="••••••••"
						{...attrs}
						bind:value={$formData.password}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button size="sm" class="w-full" disabled={isFormLoading}>
				{#if isFormLoading}
					<Loader class="mr-2 size-4 animate-spin" />
				{/if}
				{$formData.isRegister ? 'Sign Up with Email' : 'Sign In with Email'}
			</Form.Button>
		</form>

		<!-- Séparateur -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t" />
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">Or continue with</span>
			</div>
		</div>

		<Button on:click={() => {toast.info('GitHub auth not implemented yet.')}} variant="outline" disabled={isFormLoading}>
			<img src={GitHubSvg} alt="github" class="mr-2 size-4" />
			Github
		</Button>
	</div>
</div>