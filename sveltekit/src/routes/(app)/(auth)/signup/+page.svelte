<script lang="ts">
	import GitHubSvg from '$lib/imgs/github-dark.svg';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronLeftIcon } from 'lucide-svelte';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { formSchema, type FormSchema } from '$lib/schema/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Loader } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	export let data;
	let dataForm: SuperValidated<Infer<FormSchema>> = data.form;
	let form = superForm(dataForm, {
		validators: zodClient(formSchema),
		onSubmit: () => {
			isFormLoading = true;
			console.log("ssssss", data.form.isRegister);
		},
		onUpdate: ({ result }) => {
			isFormLoading = false;
			if (result.status === 200) {
				toast.success('Success', {
					description: $formData.isRegister 
						? 'Account created successfully' 
						: 'Logged in successfully'
				});
			} else {
				toast.error('Something went wrong', {
					description: result.message?.error || 'Authentication failed'
				});
			}
		},
	});

	const { form: formData, enhance } = form;

	let loading = false;
	let isFormLoading = false;
	let githubSignIn = async () => {
		loading = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		loading = false;
	};

	const toggleAuthMode = () => {
		$formData.isRegister = !$formData.isRegister;
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

		<!-- Form -->
		<form method="POST" use:enhance class="space-y-4">
			<input type="hidden" name="isRegister" bind:value={$formData.isRegister} />

			{#if $formData.isRegister}
				<Form.Field {form} name="name" class="mb-4">
					<!-- <Form.Label>Name</Form.Label> -->
					<Form.Control let:attrs>
						<Input 
							placeholder="Your name" 
							{...attrs} 
							bind:value={$formData.name} 
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			<Form.Field {form} name="email" class="mb-4">
				<!-- <Form.Label>Email</Form.Label> -->
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
				<!-- <Form.Label>Password</Form.Label> -->
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
				{$formData.isRegister ? 'Sign Up' : 'Sign In'}
			</Form.Button>
		</form>

		<!-- Separator -->
		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t" />
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">Or continue with</span>
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
	</div>
</div>