import { writable } from 'svelte/store';

export const session = writable<{
    user: null | any;
    loading: boolean;
}>({
    user: null,
    loading: true
});