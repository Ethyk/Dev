<script lang="ts">
    import { onMount } from 'svelte';
  
    let email = 'test@example.com';
    let password = 'password';
    let error: string | null = null;
    let user: any = null;
    let loading = false;
    let logoutLoading = false;
  
    // Fonction pour obtenir le cookie CSRF
    async function obtenirCsrfCookie() {
      const response = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du cookie CSRF');
      }
    }
  
    // Fonction pour extraire le cookie XSRF-TOKEN depuis document.cookie
    function recupererXsrfToken(): string | null {
      const cookieMatch = document.cookie
        .split('; ')
        .find(cookie => cookie.startsWith('XSRF-TOKEN='));
      if (!cookieMatch) return null;
      return decodeURIComponent(cookieMatch.split('=')[1]);
    }
  
    // Fonction pour récupérer l'utilisateur connecté
    async function fetchUser() {
      const response = await fetch('http://localhost:8000/api/user', {
        credentials: 'include'
      });
      if (response.ok) {
        user = await response.json();
      } else {
        user = null;
      }
    }
  
    // Fonction de login
    async function login(event: Event) {
      event.preventDefault();
      error = null;
      loading = true;
      try {
        await obtenirCsrfCookie();
        const xsrfToken = recupererXsrfToken();
        if (!xsrfToken) {
          throw new Error('Le cookie XSRF-TOKEN n\'a pas été trouvé');
        }
        const loginResponse = await fetch('http://localhost:8000/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrfToken
          },
          body: JSON.stringify({ email, password })
        });
  
        if (!loginResponse.ok) {
          const data = await loginResponse.json();
          error = data.message || 'Échec du login';
          user = null;
        } else {
          // Après login, on récupère les infos utilisateur
          await fetchUser();
        }
      } catch (e: any) {
        error = e.message || 'Erreur lors du processus de login';
        user = null;
      }
      loading = false;
    }
  
    // Fonction de logout
    async function logout() {
      logoutLoading = true;
      error = null;
      try {
        await obtenirCsrfCookie();
        const xsrfToken = recupererXsrfToken();
        if (!xsrfToken) {
          throw new Error('Le cookie XSRF-TOKEN n\'a pas été trouvé');
        }
        const logoutResponse = await fetch('http://localhost:8000/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-XSRF-TOKEN': xsrfToken,
            'Accept': 'application/json'
          }
        });
  
        if (!logoutResponse.ok) {
          const data = await logoutResponse.json();
          error = data.message || 'Échec de la déconnexion';
        } else {
          user = null;
          email = '';
          password = '';
        }
      } catch (e: any) {
        error = e.message || 'Erreur lors du processus de déconnexion';
      }
      logoutLoading = false;
    }
  
    // Si déjà connecté, on récupère l'utilisateur au chargement
    onMount(fetchUser);
  </script>
  
  <main>
    <h1>Page de Login</h1>
  
    {#if user}
      <div>
        <h2>Bienvenue, {user.name} !</h2>
        <p><strong>Email :</strong> {user.email}</p>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <button on:click={logout} disabled={logoutLoading}>
          {logoutLoading ? 'Déconnexion...' : 'Se déconnecter'}
        </button>
      </div>
    {:else}
      <form on:submit={login}>
        <input
          type="email"
          placeholder="Email"
          bind:value={email}
          required
          autocomplete="username"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          bind:value={password}
          required
          autocomplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        {#if error}
          <p style="color: red;">{error}</p>
        {/if}
      </form>
    {/if}
  </main>
  