<script lang="ts">
	import { Eye } from '@lucide/svelte';

	interface Props {
		id : string;
	}

	let { id }: Props = $props();
</script>

<a
	href        = "/events/{ id }"
	class       = "p-2 rounded-lg text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all cursor-pointer inline-flex items-center justify-center"
	aria-label  = "Ver detalles"
    title       = "Ver detalles"
>
	<Eye size={ 16 } />
</a>
