<script lang="ts">
	import { Users } from '@lucide/svelte';

	import Actions from '$lib/components/shared/Actions.svelte';
	import Preview from '$lib/components/shared/Preview.svelte';
	import type { Family } from '$lib/types/index.js';


	interface Props {
		families : Family[];
		onDelete : ( family: Family ) => void;
	}


	let {
		families,
		onDelete
	}: Props = $props();
</script>

<div class="card overflow-hidden">
	{#if families.length === 0}
		<div class="flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
			<Users size={ 48 } class="mb-4 opacity-20" />
			<p class="text-sm font-medium">No se encontraron familias registradas.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bg-surface-2 select-none">
						<th class="text-left px-6 py-4 font-semibold text-text-secondary">Nombre de Familia</th>
						<th class="text-left px-6 py-4 font-semibold text-text-secondary">Código</th>
						<th class="px-6 py-4 font-semibold text-text-secondary text-center">Nº Miembros</th>
						<th class="text-right px-6 py-4 font-semibold text-text-secondary">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each families as family}
						<tr class="hover:bg-bg-surface-2/40 transition-colors">
							<td class="px-6 py-4 font-semibold text-text-primary">
								{ family.family_name }
							</td>

							<td class="px-6 py-4 text-text-secondary font-mono">
								#{ String( family.code ).padStart( 5, '0' ) }
							</td>

							<td class="px-6 py-4 text-center">
								<a href="/families/{ family.id }/members" class="hover:opacity-85 transition-opacity">
									<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-muted text-accent">
										<Users size={ 12 } />
										{ family.members_count ?? 0 }
									</span>
								</a>
							</td>

							<td class="px-6 py-4 flex justify-end items-center gap-1">
								<Preview href={ `/families/${ family.id }/members` } />
								<Actions
									editHref={ `/families/form?id=${ family.id }` }
									canDelete={ true }
									onDelete={ () => onDelete( family ) }
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
