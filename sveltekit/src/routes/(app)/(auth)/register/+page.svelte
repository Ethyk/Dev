<script lang="ts">
    import { goto } from '$app/navigation';
    let name = '';
    let email = '';
    let password = '';
    let password_confirmation = '';
    let error: string | null = null;
    let loading = false;
  
    async function handleRegister(event: Event) {
      event.preventDefault();
      error = null;
      loading = true;
      try {
        // Appel du endpoint Laravel Sanctum pour le CSRF
        await fetch('http://localhost:8000/sanctum/csrf-cookie', {
          credentials: 'include'
        });

         // Fonction pour extraire le cookie XSRF-TOKEN depuis document.cookie
        function getXsrfToken(): string | null {
        const cookieMatch = document.cookie
            .split('; ')
            .find(cookie => cookie.startsWith('XSRF-TOKEN='));
        if (!cookieMatch) return null;
        return decodeURIComponent(cookieMatch.split('=')[1]);
        }

        const xsrfToken = getXsrfToken(); // même fonction que pour login

  
        const response = await fetch('http://localhost:8000/register', {
          method: 'POST',
        //   headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrfToken
            },
          credentials: 'include',
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation
          })
        });
  
        if (response.ok) {
          // Redirige vers la page de login après inscription réussie
          goto('/login');
        } else {
          const data = await response.json();
          error = data.message || (data.errors && Object.values(data.errors).flat().join(', ')) || 'Erreur lors de l’inscription';
        }
      } catch (e: any) {
        error = e.message || 'Erreur réseau';
      }
      loading = false;
    }
  </script>
  
  <main>
    <h1>Créer un compte</h1>
    {#if error}
      <p style="color: red;">{error}</p>
    {/if}
    <form on:submit={handleRegister} autocomplete="off">
      <div>
        <input
          type="text"
          placeholder="Nom"
          bind:value={name}
          required
          autocomplete="name"
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          bind:value={email}
          required
          autocomplete="email"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Mot de passe"
          bind:value={password}
          required
          autocomplete="new-password"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          bind:value={password_confirmation}
          required
          autocomplete="new-password"
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Inscription...' : 'S’inscrire'}
      </button>
    </form>
    <p>
      Déjà un compte ? <a href="/login">Se connecter</a>
    </p>
  </main>
  