<script lang="ts">
	import { AlertCircle } from '@lucide/svelte';

	interface Props {
		label?       : string;
		value        : string;
		error?       : string | null;
		placeholder? : string;
		required?    : boolean;
		id?          : string;
		disabled?    : boolean;
	}

	let {
		label       = '',
		value       = $bindable(),
		error       = null,
		placeholder = '',
		required    = false,
		id          = '',
		disabled    = false
	} : Props = $props();
</script>

<div class="flex flex-col gap-1.5 w-full">
	{#if label}
		<label for={ id } class="text-sm font-medium text-(--text-primary) select-none">
			{ label }
			{#if required}
				<span class="text-red-500">*</span>
			{/if}
		</label>
	{/if}

	<input
		type={ "text" }
		{ id }
		{ placeholder }
		{ required }
		{ disabled }
		bind:value={ value }
		class="w-full px-4 py-2.5 rounded-xl border transition-all duration-200
		       bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted)
		       focus:outline-none focus:ring-2 focus:ring-(--accent)/20
		       { error
		           ? 'border-red-500 focus:border-red-500'
		           : 'border-(--border) focus:border-(--border-focus)' }
		       disabled:opacity-60 disabled:cursor-not-allowed"
	/>

	{#if error}
		<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
			<AlertCircle size={ 14 } class="shrink-0" />
			<span>{ error }</span>
		</div>
	{/if}
</div>
