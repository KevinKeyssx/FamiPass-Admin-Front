<script lang="ts">
	import { Select } from 'bits-ui';
	import { AlertCircle, ChevronDown, Check } from '@lucide/svelte';

	interface Option {
		value : string;
		label : string;
	}

	interface Props {
		label?       : string;
		value        : string;
		options      : Option[];
		placeholder? : string;
		error?       : string | null;
		required?    : boolean;
		disabled?    : boolean;
	}

	let {
		label       = '',
		value       = $bindable(''),
		options     = [],
		placeholder = 'Selecciona una opción',
		error       = null,
		required    = false,
		disabled    = false
	} : Props = $props();

	let selectedLabel = $derived(
		options.find( ( o ) => o.value === value )?.label ?? ''
	);
</script>

<Select.Root type="single" bind:value={ value } { disabled } { required }>
	<div class="flex flex-col gap-1.5 w-full">
		{#if label}
			<span class="text-sm font-medium text-text-primary select-none">
				{ label }
				{#if required}
					<span class="text-accent">*</span>
				{/if}
			</span>
		{/if}

		<div class="relative w-full">
			<Select.Trigger
				class="w-full px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between text-left
				       bg-bg-surface-2 text-text-primary placeholder:text-text-muted
				       focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
				       { error
				           ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
				           : 'border-border hover:border-accent/40' }
				       disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
			>
				<span class={ selectedLabel ? '' : 'text-text-muted' }>
					{ selectedLabel || placeholder }
				</span>
				<ChevronDown size={ 16 } class="text-text-muted group-focus:text-accent group-hover:text-accent transition-colors shrink-0 ml-2" />
			</Select.Trigger>

			<Select.Content
				class="z-50 rounded-2xl border border-border bg-bg-surface p-1.5 shadow-lg animate-in fade-in duration-200 w-[var(--bits-select-anchor-width)] min-w-[12rem]"
				sideOffset={ 4 }
			>
				{#each options as opt}
					<Select.Item
						value={ opt.value }
						label={ opt.label }
						class="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none
						       text-text-primary hover:bg-bg-surface-2
						       data-[selected]:bg-accent-muted data-[selected]:text-accent"
					>
						{ opt.label }
						{#if value === opt.value}
							<Check size={ 16 } class="text-accent shrink-0" />
						{/if}
					</Select.Item>
				{/each}
			</Select.Content>
		</div>

		{#if error}
			<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
				<AlertCircle size={ 14 } class="shrink-0" />
				<span>{ error }</span>
			</div>
		{/if}
	</div>
</Select.Root>
