<script lang="ts">
	interface Option {
		value : string;
		label : string;
	}

	interface Props {
		value   : string;
		options : Option[];
		label?  : string;
	}

	let {
		value = $bindable(),
		options,
		label = ''
	}: Props = $props();

	function selectOption( val: string ): void {
		if ( value === val ) {
			value = 'ALL';
		} else {
			value = val;
		}
	}
</script>

<div class="flex items-center gap-2 shrink-0">
	{#if label}
		<span class="text-[10px] text-text-secondary font-bold uppercase tracking-wider whitespace-nowrap">
			{ label }
		</span>
	{/if}

	<div class="inline-flex rounded-full border border-border/50 p-0.5 bg-bg-surface-2/40 backdrop-blur-xs select-none">
		{#each options as opt}
			<button
				type="button"
				onclick={ () => selectOption( opt.value ) }
				class="px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer
					{ value === opt.value
						? 'bg-accent text-accent-text shadow-sm shadow-accent/20'
						: 'text-text-secondary hover:text-text-primary hover:bg-border/30' }"
			>
				{ opt.label }
			</button>
		{/each}
	</div>
</div>
