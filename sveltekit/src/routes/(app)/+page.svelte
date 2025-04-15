<script lang="ts">
	import { seo } from '$lib';
	import ClientSection from '$lib/components/landing/ClientSection.svelte';
	import CtaSection from '$lib/components/landing/CtaSection.svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import PricingSection from '$lib/components/landing/PricingSection.svelte';
	import SphereMask from '$lib/components/magic/SphereMask/SphereMask.svelte';
	export let data;

	const { user } = data;

</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="keywords" content={seo.keywords} />

	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:image" content={seo.image} />
	<meta property="og:site_name" content={seo.title} />
	<meta property="og:url" content={seo.url} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={seo.image} />
	<meta name="twitter:site" content="@Sikandar_Bhide" />
</svelte:head>
{#if user}
  <h2>Bienvenue, {user.name} !</h2>
  <p>Email : {user.email}</p>
  <pre>{JSON.stringify(user, null, 2)}</pre>
{:else}
  <p>Vous n'êtes pas connecté.</p>
{/if}
<HeroSection />
<ClientSection />
<SphereMask />
<PricingSection />
<CtaSection />
