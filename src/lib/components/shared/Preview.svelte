<script lang="ts">
	import { Eye } from '@lucide/svelte';

	interface Props {
		href : string;
	}

	let { href }: Props = $props();
</script>

<a
	href        = { href }
	class       = "p-2 rounded-lg hover:text-(--accent) hover:bg-(--accent-muted) transition-all cursor-pointer inline-flex items-center justify-center text-calypso-500 dark:hover:text-calypso-500 dark:hover:bg-calypso-700/20"
	aria-label  = "Ver detalles"
	title       = "Ver detalles"
>
	<Eye size={ 16 } />
</a>
