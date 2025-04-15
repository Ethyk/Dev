<!-- src/routes/login/+page.svelte -->
<script>
    export let form;
  </script>
  
  <form method="POST" >
    <input name="email" type="email" placeholder="Email" value="admin@devcraft.us" required />
    <input name="password" type="password" placeholder="Mot de passe" required value="trustnx332" />
    <button type="submit">Connexion</button>
    {#if form?.error}
      <p style="color:red">{form.error}</p>
    {/if}
  </form>
  