<script lang="ts">
	import { goto } from '$app/navigation';

    import { ArrowLeft } from '@lucide/svelte';


	interface Props {
		href   : string;
		label? : string;
	}


    let { href, label = '' }: Props = $props();


    function handleKeyDown( event: KeyboardEvent ): void {
		if ( event.key !== 'Escape' ) return ;

        const active = document.activeElement;

        if (
            active &&
            (
                active.tagName === 'INPUT'
                || active.tagName === 'TEXTAREA'
                || active.getAttribute( 'contenteditable' ) === 'true'
            )
        ) return;

        goto( href );
	}
</script>


<svelte:window onkeydown={ handleKeyDown } />


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
