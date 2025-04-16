<script lang="ts">
	import GitHubSvg from '$lib/imgs/github-dark.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronLeftIcon, Loader } from 'lucide-svelte';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { loginSchema, type LoginSchema } from '$lib/schema/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let dataForm: SuperValidated<Infer<loginSchema>> = data.form;

	let isFormLoading = false;
	let loading = false;

	// Fonction pour obtenir le cookie XSRF-TOKEN
	function getXsrfToken() {
		const match = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='));
		return match ? decodeURIComponent(match.split('=')[1]) : null;
	}

	// Logique de login côté client, branchée sur onSubmit de superForm
	async function handleLogin({
  formData,
  cancel
}: {
  formData: FormData;
  formElement: HTMLFormElement;
  action: URL;
  controller: AbortController;
  submitter: HTMLElement | null;
  cancel: () => void;
}) {
  isFormLoading = true;

  // Récupère les valeurs du formulaire
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      credentials: 'include'
    });

    const xsrfToken = getXsrfToken();
    if (!xsrfToken) {
      toast.error('Impossible de récupérer le XSRF-TOKEN');
      isFormLoading = false;
      cancel();
      return;
    }

    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.message || 'Échec du login');
      isFormLoading = false;
      cancel();
      return;
    }

    toast.success('Connexion réussie !');
    goto('/dashboard');
	const user = await response.json();
	// console.log(user);
  } catch (e) {
    toast.error('Erreur lors du login');
    cancel();
  }
  isFormLoading = false;
}


	let form = superForm(dataForm, {
		validators: zodClient(loginSchema),
		onSubmit: handleLogin,
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
	<title>Sign In | Svee UI</title>
	<meta name="description" content="Sign In for Svee UI" />
</svelte:head>

<div class="container flex h-screen w-screen flex-col items-center justify-center">
	<Button variant="ghost" href="/" class="absolute left-4 top-4 md:left-8 md:top-8">
		<ChevronLeftIcon class="mr-2 size-4" />
		Back
	</Button>
	<div class="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
		<div class="flex flex-col gap-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
			<p class="text-sm text-muted-foreground">Login to your account</p>
		</div>
		<!-- Form -->
		<form method="POST" use:enhance>
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
			<Form.Button size="sm" class="w-full" disabled={isFormLoading}>
				{#if isFormLoading}
					<Loader class="mr-2 size-4 animate-spin" />
				{/if}
				Sign In with Email
			</Form.Button>
		</form>
		<!-- Separator -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t" />
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
			</div>
		</div>
		<Button onclick={githubSignIn} variant="outline" disabled={loading}>
			{#if loading}
				<Loader class="mr-2 size-4 animate-spin" />
			{:else}
				<img src={GitHubSvg} alt="github" class="mr-2 size-4" />
			{/if}
			Github
		</Button>
		<p class="px-8 text-center text-sm text-muted-foreground">
			<a href="/signup" class="hover:text-brand underline underline-offset-4">
				Don&apos;t have an account? Sign Up
			</a>
		</p>
	</div>
</div>
