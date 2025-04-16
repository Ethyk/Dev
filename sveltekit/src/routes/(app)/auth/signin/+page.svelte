<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import GitHubSvg from '$lib/imgs/github-dark.svg';

	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';

	import * as Form from '$lib/components/ui/form';

	import { toast } from 'svelte-sonner';
	import { loginSchema, type LoginSchema } from '$lib/schema/schema';
	import { Loader } from 'lucide-svelte';
  
	let loading = $state(false);
	let isFormLoading = $state(false);

	let { data } = $props();// as { form: SuperValidated<Infer<LoginSchema>> };

	// let dataForm: SuperValidated<Infer<LoginSchema>> = data.form;

	const form = superForm(data.form, {
			validators: zodClient(loginSchema),
			onSubmit: () => {
			isFormLoading = true;
		},
		onUpdate: ({ result }) => {
			isFormLoading = false;
			if (result.status === 200) {
				// Si la connexion est réussie
				window.location.href = '/dashboard'; // Ou redirection avec `goto()` si tu veux utiliser l'API de SvelteKit
				toast.success('Connexion réussie', {
					description: 'We have sent you a login link. Be sure to check your spam too.'
				});
			} else {
				toast.error('Quelque chose s\'est mal passé', {
					description: result.data.message
				});
			}
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
	<div class="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
	  <div class="flex flex-col gap-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
		<p class="text-sm text-muted-foreground">Login to your account</p>
	  </div>
  
	  <!-- Form -->


	  <form method="POST" use:enhance>
	
		<Form.Field {form} name="email">
			<Form.Control>
			  {#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} />
			  {/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		  </Form.Field>
  
		  <Form.Field {form} name="password">
			  <Form.Control>
				{#snippet children({ props })}
				  <Form.Label>Password</Form.Label>
				  <Input {...props}  type="password" placeholder="******"  bind:value={$formData.password} required />
				{/snippet}
			  </Form.Control>
			  <Form.Description />
			  <Form.FieldErrors />
			</Form.Field>

			<Form.Button size="sm" class="w-full" disabled={isFormLoading}>
				{#if isFormLoading}
					<Loader class="mr-2 size-4 animate-spin" />
				{/if}
				Sign In with Email</Form.Button
			>
	  </form>
  
	  <!-- Separator for OAuth -->
	  <div class="relative mt-4">
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
		GitHub
	  </Button>
  
	  <p class="px-8 text-center text-sm text-muted-foreground">
		<a href="/signup" class="hover:text-brand underline underline-offset-4">
		  Don&apos;t have an account? Sign Up
		</a>
	  </p>
	</div>
  </div>
  