<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

    import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

    import { theme } from '$lib/stores/theme.svelte.js';


    const queryClient = new QueryClient( {
		defaultOptions: {
			queries: {
				staleTime : 1000 * 60,
				retry     : 1,
			},
		},
	});

	let { children } = $props();

	onMount( () => {
		theme.init();
	});
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
