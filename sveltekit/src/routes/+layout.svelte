<script lang="ts">
        import { session } from '$lib/stores/session.store';
        import { page } from '$app/stores';
	import '../app.css';
    import { ModeWatcher } from 'mode-watcher';
	import { derived } from 'svelte/store';


    // export const session = derived(page, ($page) => ({
    //     user: $page.data.user,
    //     loading: false
    // }));

    // let { session } = $props();

</script>

<ModeWatcher />

<slot></slot>
