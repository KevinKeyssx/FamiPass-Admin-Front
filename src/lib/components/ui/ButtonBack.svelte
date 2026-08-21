<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';

	interface Props {
		href   : string;
		label? : string;
	}

	let { href, label = '' }: Props = $props();
</script>

<a
	{ href }
	class="inline-flex items-center gap-2 p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted border border-border/40 bg-transparent transition-all duration-300 group/back shrink-0 focus-ring"
	aria-label="Volver"
>
	<ArrowLeft
		size={ 18 }
		class="transition-transform duration-300 group-hover/back:-translate-x-1 shrink-0"
	/>
	{#if label}
		<span class="text-xs font-semibold pr-1">{ label }</span>
	{/if}
</a>
