<script lang="ts">
	import GitHubSvg from '$lib/imgs/github-dark.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronLeftIcon, Loader } from 'lucide-svelte';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { registerSchema, type RegisterSchema } from '$lib/schema/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	export let data;
	let dataForm: SuperValidated<Infer<registerSchema>> = data.form;

	let isFormLoading = false;
	let loading = false;

	// Fonction pour obtenir le cookie XSRF-TOKEN
	function getXsrfToken() {
		const match = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='));
		return match ? decodeURIComponent(match.split('=')[1]) : null;
	}

	// Logique d'inscription côté client, branchée sur onSubmit de superForm
	async function handleSignup({ formData, cancel }) {
		isFormLoading = true;

		// Récupère les valeurs du formulaire
		const name = formData.get('name');
		const email = formData.get('email');
		const password = formData.get('password');
		const password_confirmation = formData.get('password_confirmation');

		try {
			// 1. Obtenir le cookie CSRF
			await fetch('http://localhost:8000/sanctum/csrf-cookie', {
				credentials: 'include'
			});

			// 2. Récupérer le XSRF-TOKEN
			const xsrfToken = getXsrfToken();
			if (!xsrfToken) {
				toast.error('Impossible de récupérer le XSRF-TOKEN');
				isFormLoading = false;
				cancel();
				return;
			}

			// 3. Envoyer la requête d'inscription
			const response = await fetch('http://localhost:8000/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-XSRF-TOKEN': xsrfToken,
					'Accept': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					name,
					email,
					password,
					password_confirmation
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.message || 'Échec de l\'inscription');
				isFormLoading = false;
				cancel();
				return;
			}

			toast.success('Inscription réussie !');
			goto('/dashboard');
		} catch (e) {
			toast.error('Erreur lors de l\'inscription');
			cancel();
		}
		isFormLoading = false;
	}

	let form = superForm(dataForm, {
		validators: zodClient(registerSchema),
		onSubmit: handleSignup,
		onUpdate: ({ result }) => {
			isFormLoading = false;
		}
	});

	const { form: formData, enhance } = form;

	let githubSignIn = async () => {
		loading = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		loading = false;
	};
</script>

<svelte:head>
	<title>Sign Up | Svee UI</title>
	<meta name="description" content="Sign Up for Svee UI" />
</svelte:head>

<div class="container flex h-screen w-screen flex-col items-center justify-center">
	<Button variant="ghost" href="/" class="absolute left-4 top-4 md:left-8 md:top-8">
		<ChevronLeftIcon class="mr-2 size-4" />
		Back
	</Button>
	<div class="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
		<div class="flex flex-col gap-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">Welcome to Svee UI</h1>
			<p class="text-sm text-muted-foreground">Sign up for an account</p>
		</div>
		<!-- Form -->
		<form method="POST" use:enhance>
			<Form.Field {form} name="name" class="mb-4">
				<Form.Control>
					{#snippet children({ props })}
					<Form.Label>Nom</Form.Label>
					<Input placeholder="jone doe" {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="email" class="mb-4">
				<Form.Control>
					{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input placeholder="name@example.com" {...props} bind:value={$formData.email} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password" class="mb-4">
				<Form.Control>
					{#snippet children({ props })}
					<Form.Label>Password</Form.Label>
					<Input type="password" placeholder="******" {...props} bind:value={$formData.password} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password_confirmation" class="mb-4">
				<Form.Control>
					{#snippet children({ props })}
					<Form.Label>Password Conf</Form.Label>
					<Input type="password" placeholder="******" {...props} bind:value={$formData.password_confirmation} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button size="sm" class="w-full" disabled={isFormLoading}>
				{#if isFormLoading}
					<Loader class="mr-2 size-4 animate-spin" />
				{/if}
				Sign Up with Email
			</Form.Button>
		</form>
		<!-- Separator -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
			</div>
		</div>
		<Button on:click={githubSignIn} variant="outline" disabled={loading}>
			{#if loading}
				<Loader class="mr-2 size-4 animate-spin" />
			{:else}
				<img src={GitHubSvg} alt="github" class="mr-2 size-4" />
			{/if}
			Github
		</Button>

		<p class="px-8 text-center text-sm text-muted-foreground">
			<a href="/signin" class="hover:text-brand underline underline-offset-4">
				Already have an account? Sign In
			</a>
		</p>
	</div>
</div>
