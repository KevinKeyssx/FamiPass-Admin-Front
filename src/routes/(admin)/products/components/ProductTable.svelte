<script lang="ts">
	import { Package } from '@lucide/svelte';

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

<div class="card overflow-hidden">
	{#if products.length === 0 }
		<div class="flex flex-col items-center py-16 text-(--text-muted)">
			<Package size={ 48 } class="mb-3 opacity-30" />
			<p class="text-sm">No hay productos disponibles.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-(--border) bg-(--bg-surface-2)">
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary)">Nombre</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden sm:table-cell">Descripción</th>
						<th class="text-center px-4 py-3 font-semibold text-(--text-secondary) hidden md:table-cell">Cant. por Persona</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary)">Estado</th>
						<th class="text-right px-4 py-3 font-semibold text-(--text-secondary)">Acciones</th>
					</tr>
				</thead>

                <tbody class="divide-y divide-(--border)">
					{#each products as product}
						<tr class="hover:bg-(--bg-surface-2) transition-colors">
							<td class="px-4 py-3">
								<p class="font-medium text-(--text-primary) truncate max-w-45">{ product.name }</p>
							</td>

                            <td class="px-4 py-3 text-(--text-secondary) hidden sm:table-cell truncate max-w-64">
								{ product.description ?? '—' }
							</td>

                            <td class="px-4 py-3 text-(--text-primary) hidden md:table-cell text-center font-medium">
								{ product.default_quantity_per_person }
                            </td>

                            <td class="px-4 py-3">
								{#if product.is_active }
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
										Activo
									</span>
								{:else}
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
										Inactivo
									</span>
								{/if}
							</td>

                            <td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									<Actions
										editHref="/products/form?id={ product.id }"
										canDelete={ true }
										onDelete={() => { onDelete( product ); }}
									/>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
