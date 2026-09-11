<script lang="ts">
	import { Plus } from '@lucide/svelte';

	interface Props {
		href?    : string;
		label    : string;
		prefix?  : string;
		icon?    : any;
		class?   : string;
		onclick? : ( e: MouseEvent ) => void;
	}

	let {
		href,
		label,
		prefix    = 'Nuevo',
		icon      = Plus,
		class     : className = '',
		onclick
	} : Props = $props();

	const Icon = $derived( icon );
</script>

{#if href}
	<a
		{ href }
		class="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl
			text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 select-none cursor-pointer
			bg-(--accent) text-(--accent-text) hover:opacity-90 hover:shadow-lg hover:shadow-(--accent)/20
			hover:-translate-y-0.5 active:scale-95 transition-all duration-300 shadow-sm { className }"
	>
		<Icon size={ 16 } class="shrink-0" />

		<span class="sm:hidden">{ label }</span>

		<span class="hidden sm:inline">{ prefix } { label }</span>
	</a>
{:else}
	<button
		type="button"
		{ onclick }
		class="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl
			text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 select-none cursor-pointer
			bg-(--accent) text-(--accent-text) hover:opacity-90 hover:shadow-lg hover:shadow-(--accent)/20
			hover:-translate-y-0.5 active:scale-95 transition-all duration-300 shadow-sm { className }"
	>
		<Icon size={ 16 } class="shrink-0" />

		<span class="sm:hidden">{ label }</span>

		<span class="hidden sm:inline">{ prefix } { label }</span>
	</button>
{/if}
