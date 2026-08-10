<script lang="ts">
	import { Package, Clock, CheckCircle2, XCircle } from '@lucide/svelte';

    import type { Product } from '$lib/types/index.js';
	import Actions          from '$lib/components/shared/Actions.svelte';


    interface Props {
		products : Product[];
		onDelete : ( product: Product ) => void;
	}


    let {
		products,
		onDelete
	}: Props = $props();
</script>

{#if products.length === 0 }
	<div class="card flex flex-col items-center py-16 text-(--text-muted)">
		<Package size={ 48 } class="mb-3 opacity-30" />

        <p class="text-sm">No hay productos disponibles.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
		{#each products as product}
			<div class="card p-5 flex flex-col justify-between gap-4 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 scale-100 hover:border-(--accent) hover:scale-[1.01] hover:shadow-md hover:shadow-(--accent)/8 !transition-all duration-500 ease-out rounded-2xl relative overflow-hidden group">
				<!-- Header -->
				<div class="space-y-1 relative z-10">
					<h3 class="font-bold text-base text-(--text-primary) line-clamp-2" title={ product.name }>
						{ product.name }
					</h3>

                    {#if product.description }
						<p class="text-xs text-(--text-secondary) line-clamp-2" title={ product.description }>
							{ product.description }
						</p>
					{:else}
						<p class="text-xs text-(--text-secondary) italic">Sin descripción</p>
					{/if}
				</div>

				<!-- Content / Info Grid -->
				<div class="grid grid-cols-2 gap-2.5 my-1 text-xs relative z-10">
					<!-- Cantidad por persona -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						<div class="p-2 rounded-lg bg-(--accent-muted) text-(--accent) shrink-0 transition-transform group-hover/item:scale-110">
							<Package size={ 14 } />
						</div>

                        <div class="truncate">
							<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Cant. Persona</p>
							<p class="font-semibold text-(--text-primary) mt-1 leading-none">{ product.default_quantity_per_person }</p>
						</div>
					</div>

					<!-- Estado -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						{#if product.is_active }
							<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shrink-0 transition-transform group-hover/item:scale-110">
								<CheckCircle2 size={ 14 } />
							</div>

                            <div class="truncate">
								<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Estado</p>
								<p class="font-semibold text-emerald-500 dark:text-emerald-400 mt-1 leading-none">Activo</p>
							</div>
						{:else}
							<div class="p-2 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 shrink-0 transition-transform group-hover/item:scale-110">
								<XCircle size={ 14 } />
							</div>

                            <div class="truncate">
								<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Estado</p>
								<p class="font-semibold text-red-500 dark:text-red-400 mt-1 leading-none">Inactivo</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-between border-t border-(--border)/40 pt-3 mt-0 relative z-10">
					<span class="text-[11px] text-(--text-secondary) flex items-center gap-1.5">
						<Clock size={ 14 } />

                        Creado: { product.created_at ? new Date( product.created_at ).toLocaleDateString( 'es-CL', {
							day   : '2-digit',
							month : '2-digit',
							year  : 'numeric'
						}) : '—' }
					</span>

					<div class="flex items-center gap-1.5">
						<Actions
							editHref="/products/form?id={ product.id }"
							canDelete={ true }
							onDelete={() => { onDelete( product ); }}
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
