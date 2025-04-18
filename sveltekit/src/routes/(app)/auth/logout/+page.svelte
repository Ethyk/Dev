<script>
  import { enhance } from '$app/forms';
</script>

<div class="logout-container">
  <h2>Déconnexion</h2>
  <p>Voulez-vous vous déconnecter ?</p>
  <form method="POST" use:enhance>
    <button type="submit">Se déconnecter</button>
  </form>
</div>

<style>
  .logout-container {
    max-width: 400px;
    margin: 2rem auto;
    text-align: center;
  }
  button {
    background-color: #dc3545;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background-color: #c82333;
  }
</style>