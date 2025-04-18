<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { toast } from 'svelte-sonner';
	import { loginSchema, type LoginSchema } from '$lib/schema/schema';
	import { Loader } from 'lucide-svelte';
  
	let isFormLoading = $state(false);
	let { data }: { data: { form: SuperValidated<Infer<LoginSchema>> } } =
		$props();
  
	const form = superForm(data.form, {
	  validators: zodClient(loginSchema),
	  onSubmit: () => {
		isFormLoading = true;
	  },
	  onUpdated: ({ form }) => {
		isFormLoading = false;
		if (!form.valid) {
		  toast.error('Erreur de validation', { description: 'Vérifiez vos informations' });
		}
	  },
	});
  
	const { form: formData, enhance, errors } = form;
  </script>
  
  <svelte:head>
	<title>Connexion</title>
	<meta name="description" content="Connexion à l'application" />
  </svelte:head>
  
  <div class="container flex h-screen w-screen flex-col items-center justify-center">
	<div class="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
	  <div class="flex flex-col gap-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Bienvenue</h1>
		<p class="text-sm text-muted-foreground">Connectez-vous à votre compte</p>
	  </div>
  
	  <form method="POST" use:enhance>
		<Form.Field {form} name="email">
		  <Form.Control >
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} />
			{/snippet}
		  </Form.Control>
		  <Form.FieldErrors />
		</Form.Field>
  
		<Form.Field {form} name="password">
		  <Form.Control>
			{#snippet children({ props })}
				<Form.Label>Mot de passe</Form.Label>
				<Input {...props} type="password" bind:value={$formData.password} />
			{/snippet}

		  </Form.Control>
		  <Form.FieldErrors />
		</Form.Field>
  
		<Form.Button class="w-full" disabled={isFormLoading}>
		  {#if isFormLoading}
			<Loader class="mr-2 size-4 animate-spin" />
		  {/if}
		  Se connecter
		</Form.Button>
	  </form>
  
	  <p class="px-8 text-center text-sm text-muted-foreground">
		<a href="/auth/signup" class="hover:text-brand underline underline-offset-4">
		  Pas de compte ? Inscrivez-vous
		</a>
	  </p>
	</div>
  </div>