<script lang="ts">
	import { Pencil, Trash2 } from '@lucide/svelte';


	interface Props {
		editHref             : string;
		canDelete            : boolean;
		canEdit?             : boolean;
		disabledEditTooltip? : string;
		onDelete             : () => void;
	}


	let {
		editHref,
		canDelete,
		canEdit             = true,
		disabledEditTooltip = 'No se puede editar este elemento',
		onDelete
	}: Props = $props();
</script>

<div class="flex items-center gap-1">
	{#if canEdit}
		<a
			href        = { editHref }
			class       = "p-2 rounded-lg hover:text-(--accent) hover:bg-(--accent-muted) transition-all cursor-pointer text-sky-500 dark:text-amber-600"
			aria-label  = "Editar"
			title       = "Editar"
		>
			<Pencil size={ 16 } />
		</a>
	{:else}
		<button
			type        = "button"
			disabled    = { true }
			class       = "p-2 rounded-lg opacity-35 cursor-not-allowed text-text-muted"
			aria-label  = { disabledEditTooltip }
			title       = { disabledEditTooltip }
		>
			<Pencil size={ 16 } />
		</button>
	{/if}

	{#if canDelete}
		<button
			onclick     = { onDelete }
			class       = "p-2 rounded-lg hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer text-amber-500 dark:text-red-500"
			aria-label  = "Eliminar"
			title       = "Eliminar"
		>
			<Trash2 size={ 16 } />
		</button>
	{/if}
</div>

