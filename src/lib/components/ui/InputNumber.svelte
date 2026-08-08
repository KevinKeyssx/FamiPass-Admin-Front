<script lang="ts">
	import { AlertCircle, Plus, Minus } from '@lucide/svelte';

	interface Props {
		label?       : string;
		value        : number | null | undefined;
		error?       : string | null;
		min?         : number;
		max?         : number;
		step?        : number;
		placeholder? : string;
		required?    : boolean;
		id?          : string;
		disabled?    : boolean;
	}

	let {
		label       = '',
		value       = $bindable(),
		error       = null,
		min         = undefined,
		max         = undefined,
		step        = 1,
		placeholder = '',
		required    = false,
		id          = '',
		disabled    = false
	} : Props = $props();

	function handleIncrement() : void {
		if ( disabled ) return;
		const current = value ?? 0;
		const newValue = current + step;
		if ( max !== undefined && newValue > max ) return;
		value = newValue;
	}

	function handleDecrement() : void {
		if ( disabled ) return;
		const current = value ?? 0;
		const newValue = current - step;
		if ( min !== undefined && newValue < min ) return;
		value = newValue;
	}
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

	<div class="flex items-center w-full relative">
		<!-- Decrement Button -->
		<button
			type={ "button" }
			onclick={ handleDecrement }
			{ disabled }
			class="absolute left-1 p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary)
			       hover:bg-(--bg-surface-2) transition-all duration-200 active:scale-90
			       disabled:opacity-40 disabled:cursor-not-allowed z-10"
			aria-label="Restar valor"
		>
			<Minus size={ 16 } />
		</button>

		<input
			type={ "number" }
			{ id }
			{ min }
			{ max }
			{ step }
			{ placeholder }
			{ required }
			{ disabled }
			bind:value={ value }
			class="w-full pl-12 pr-12 py-2.5 rounded-xl border transition-all duration-200 text-center
			       bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted)
			       focus:outline-none focus:ring-2 focus:ring-(--accent)/20
			       { error
			           ? 'border-red-500 focus:border-red-500'
			           : 'border-(--border) focus:border-(--border-focus)' }
			       disabled:opacity-60 disabled:cursor-not-allowed"
		/>

		<!-- Increment Button -->
		<button
			type={ "button" }
			onclick={ handleIncrement }
			{ disabled }
			class="absolute right-1 p-2 rounded-lg text-(--text-muted) hover:text-(--text-primary)
			       hover:bg-(--bg-surface-2) transition-all duration-200 active:scale-90
			       disabled:opacity-40 disabled:cursor-not-allowed z-10"
			aria-label="Sumar valor"
		>
			<Plus size={ 16 } />
		</button>
	</div>

	{#if error}
		<div class="flex items-center gap-1.5 text-xs text-red-500 animate-in fade-in duration-200 mt-0.5">
			<AlertCircle size={ 14 } class="shrink-0" />
			<span>{ error }</span>
		</div>
	{/if}
</div>

<style>
	/* Ocultar botones laterales nativos de inputs numéricos */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance : none;
		margin             : 0;
	}

	input[type="number"] {
		-moz-appearance : textfield;
	}
</style>
