<script lang="ts">
    export let data;
    const user = data.user;
    console.log(user);
  </script>
  
  <svelte:head>
    <title>Mon compte | Svee UI</title>
  </svelte:head>
  
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center gap-6">
      <div class="flex flex-col items-center gap-2">
        <div class="rounded-full bg-brand/10 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-10 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight">Bienvenue, {user?.name ?? 'Utilisateur'} !</h1>
        <p class="text-zinc-500 dark:text-zinc-400">Connecté avec l’email : <span class="font-mono">{user?.email}</span></p>
      </div>
      <div class="w-full">
        <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 flex flex-col gap-2">
          <div><span class="font-semibold">Nom :</span> {user?.name}</div>
          <div><span class="font-semibold">Email :</span> {user?.email}</div>
          {#if user?.created_at}
            <div><span class="font-semibold">Inscrit le :</span> {new Date(user.created_at).toLocaleDateString()}</div>
          {/if}
          <!-- Ajoute d'autres infos si besoin -->
        </div>
      </div>
      <a href="/logout" class="mt-4 text-brand hover:underline">Se déconnecter</a>
    </div>
  </div>
  