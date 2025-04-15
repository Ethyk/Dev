<script>
	import { page } from '$app/stores';
	import Footer from '$lib/layout/Footer.svelte';
	import Header from '$lib/layout/Header.svelte';
	import { session } from '$lib/stores/session.store';

	
	let user = $page.data.user; // `user` est accessible via les données de la page

	console.log(user);
	$: $session = {
        user: $page.data.user,
        loading: false
    };
</script>


<div class="min-h-screen bg-background font-sans antialiased">
	<Header />
	<div class="mx-auto flex-1 overflow-hidden">
		<slot></slot>
	</div>
	<Footer />
</div>
