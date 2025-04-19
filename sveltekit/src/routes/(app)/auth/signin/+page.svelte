<script lang="ts">
    import { type SuperValidated, superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { onMount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { Loader } from 'lucide-svelte';

    import { loginSchema, type LoginSchema } from '$lib/schema/schema'; // Votre schéma Zod
    import { PUBLIC_API_BASE_URL } from '$env/static/public';
    import { Button } from '$lib/components/ui/button'; // Vos composants UI
    import { Input } from '$lib/components/ui/input';
    import * as Form from '$lib/components/ui/form';

    let { data }: { data: { form: SuperValidated<LoginSchema> } } = $props();
    let isFormLoading = $state(false);

    // *** APPEL CSRF CÔTÉ CLIENT ***
    onMount(() => {
        console.log("Signin Page: Mounted. Fetching CSRF cookie...");
        // Utilise le fetch natif du navigateur pour obtenir le cookie initialement
        fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`, { method: 'GET', credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    console.warn("CSRF cookie fetch failed on mount, status:", response.status);
                } else {
                    console.log("CSRF cookie potentially refreshed on mount.");
                }
            })
            .catch(error => {
                console.error("Error fetching CSRF cookie on mount:", error);
            });
    });

    const form = superForm(data.form, {
        validators: zodClient(loginSchema),
        onSubmit: () => {
            console.log("Signin Page: Form submitted.");
            isFormLoading = true;
            // Optionnel: Re-fetch CSRF ici pour fraîcheur maximale juste avant soumission
            // await fetch(`${PUBLIC_API_BASE_URL}/sanctum/csrf-cookie`);
        },
        onResult: ({ result }) => {
             console.log("Signin Page: Form result received:", result);
            isFormLoading = false; // Arrêter le chargement dans tous les cas de résultat
            if (result.type === 'redirect') {
                // La redirection est gérée automatiquement par SvelteKit enhance
                toast.success('Connexion réussie ! Redirection...');
            } else if (result.type === 'error') {
                 // Erreur lancée par SvelteKit (rare ici)
                 toast.error('Erreur serveur SvelteKit', { description: result.error.message });
            } else if (result.type === 'failure') {
                // Échec retourné par `fail()` dans l'action
                 toast.error(result.data?.message || 'Échec de la connexion', {
                     description: 'Veuillez vérifier vos informations.'
                 });
            }
             // Pas besoin de gérer result.type === 'success' car on redirige
        },
        onError: ({ result, error }) => {
             // Gère les erreurs réseau ou inattendues non retournées par fail()
             console.error("Signin Page: Superform onError:", error, result);
             isFormLoading = false;
             toast.error("Erreur inattendue", { description: String(error.message || 'Impossible de soumettre le formulaire') });
        },
        // onUpdated peut être utile pour feedback instantané mais onResult/onError couvre la soumission
        // onUpdated: ({ form: currentForm }) => {
        //    console.log("Signin Page: Form updated.", currentForm);
        // }
    });

    const { form: formData, enhance, errors, message } = form; // Utilise message pour les erreurs globales

</script>

<svelte:head>
    <title>Connexion</title>
    <meta name="description" content="Connexion à votre compte" />
</svelte:head>

<div class="container flex min-h-screen w-screen flex-col items-center justify-center">
    <div class="mx-auto flex w-full max-w-sm flex-col justify-center gap-6">
        <div class="flex flex-col gap-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">Bienvenue</h1>
            <p class="text-sm text-muted-foreground">Connectez-vous à votre compte</p>
        </div>

        <form method="POST" use:enhance class="grid gap-4">
             {#if $message}
                 <p class="text-sm font-medium text-destructive">{$message}</p>
             {/if}
            <Form.Field {form} name="email">
                <Form.Control>
					{#snippet children({ props })}
                    <Form.Label>Email</Form.Label>
                    <Input {...props} type="email" bind:value={$formData.email} placeholder="nom@exemple.com"/>
					{/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="password">
                <Form.Control >
					{#snippet children({ props })}
                    <Form.Label>Mot de passe</Form.Label>
                    <Input {...props} type="password" bind:value={$formData.password} />
					{/snippet}

                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <Button type="submit" class="w-full" disabled={isFormLoading}>
                {#if isFormLoading}
                    <Loader class="mr-2 size-4 animate-spin" />
                {/if}
                Se connecter
            </Button>
        </form>

        <p class="px-8 text-center text-sm text-muted-foreground">
            <a href="/auth/signup" class="hover:text-brand underline underline-offset-4">
                Pas de compte ? Inscrivez-vous
            </a>
        </p>
    </div>
</div>