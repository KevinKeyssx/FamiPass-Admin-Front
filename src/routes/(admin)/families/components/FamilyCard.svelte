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

{#if families.length === 0}
	<div class="card flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
		<Users size={ 48 } class="mb-4 opacity-20" />
		<p class="text-sm font-medium">No se encontraron familias registradas.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
		{#each families as family}
			<div class="card p-5 flex flex-col justify-between gap-4 bg-linear-to-b from-bg-surface to-bg-surface-2 border border-border/60 scale-100 hover:border-accent hover:scale-[1.01] hover:shadow-md hover:shadow-accent/8 !transition-all duration-500 ease-out rounded-2xl relative overflow-hidden group">
				<!-- Header & Title -->
				<div class="space-y-2 relative z-10">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-xl bg-accent-muted text-accent flex items-center justify-center font-bold text-base select-none shadow-xs shrink-0">
							<Users size={ 18 } />
						</div>
						<div class="truncate">
							<h3 class="font-bold text-base text-text-primary truncate max-w-44" title={ family.family_name }>
								{ family.family_name }
							</h3>
							<p class="text-xs text-text-secondary font-mono mt-0.5">
								#{ String( family.code ).padStart( 5, '0' ) }
							</p>
						</div>
					</div>
				</div>

				<!-- Stats / Info -->
				<a href="/families/{ family.id }/members" class="hover:opacity-85 transition-opacity relative z-10">
					<div class="bg-bg-base/40 dark:bg-black/10 border border-border/30 p-3 rounded-xl flex items-center justify-between text-xs">
						<span class="text-text-secondary font-medium">Miembros registrados</span>
						<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-muted text-accent">
							{ family.members_count ?? 0 }
						</span>
					</div>
				</a>

				<!-- Footer Actions -->
				<div class="flex items-center justify-end gap-1.5 border-t border-border/40 pt-3 mt-0 relative z-10 text-xs">
					<Preview href={ `/families/${ family.id }/members` } />
					<Actions
						editHref={ `/families/form?id=${ family.id }` }
						canDelete={ true }
						onDelete={ () => onDelete( family ) }
					/>
				</div>
			</div>
		{/each}
	</div>
{/if}
