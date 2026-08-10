<script lang="ts">
	import { Pencil, Trash2 } from '@lucide/svelte';


    interface Props {
		editHref  : string;
		canDelete : boolean;
		onDelete  : () => void;
	}


    let {
		editHref,
		canDelete,
		onDelete
	}: Props = $props();
</script>

<div class="flex items-center gap-1">
	<a
		href        = { editHref }
		class       = "p-2 rounded-lg text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all cursor-pointer"
		aria-label  = "Editar"
        title       = "Editar"
	>
		<Pencil size={ 16 } />
	</a>

    {#if canDelete }
		<button
			onclick     = { onDelete }
			class       = "p-2 rounded-lg text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
			aria-label  = "Eliminar"
            title       = "Eliminar"
		>
			<Trash2 size={ 16 } />
		</button>
	{/if}
</div>
