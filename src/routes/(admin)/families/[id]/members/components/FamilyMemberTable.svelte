<script lang="ts">
	import { Users, Crown, User as UserIcon, Edit2, Trash2 } from '@lucide/svelte';
	import type { FamilyMember, CommunityOrganization }     from '$lib/types/index.js';
	import { getOrgLabel }                                   from '../../../utils/constants.js';
	import FamilyMemberRowForm                               from './FamilyMemberRowForm.svelte';

	interface Props {
		members    : FamilyMember[];
		onEdit     : ( member: FamilyMember ) => void;
		onDelete   : ( member: FamilyMember ) => void;
		onAdd      : ( data: {
			full_name         : string;
			rut               : string;
			phone             : string;
			organization      : CommunityOrganization;
			is_representative : boolean;
		} ) => Promise<boolean>;
		isSaving?  : boolean;
		saveError? : string | null;
	}

	let {
		members,
		onEdit,
		onDelete,
		onAdd,
		isSaving = false,
		saveError = null
	}: Props = $props();
</script>

<div class="card overflow-hidden">
	{#if members.length === 0}
		<div class="flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
			<Users size={ 48 } class="mb-4 opacity-20" />
			<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados.</p>
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-bg-surface-2 select-none">
					<th class="text-left px-6 py-4 font-semibold text-text-secondary w-1/4">Nombre</th>
					<th class="text-left px-6 py-4 font-semibold text-text-secondary w-1/5">RUT</th>
					<th class="text-left px-6 py-4 font-semibold text-text-secondary w-1/6">Teléfono</th>
					<th class="text-left px-6 py-4 font-semibold text-text-secondary w-1/5">Organización</th>
					<th class="text-center px-6 py-4 font-semibold text-text-secondary w-1/12">Representante</th>
					<th class="text-right px-6 py-4 font-semibold text-text-secondary w-1/10">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				{#each members as m}
					<tr class="hover:bg-bg-surface-2/40 transition-colors">
						<td class="px-6 py-4 text-text-primary font-semibold flex items-center gap-2">
							{#if m.is_representative}
								<Crown size={ 15 } class="text-accent shrink-0" />
							{:else}
								<UserIcon size={ 15 } class="text-text-muted shrink-0" />
							{/if}
							{ m.full_name }
						</td>

						<td class="px-6 py-4 text-text-secondary font-mono">
							{ m.rut }
						</td>

						<td class="px-6 py-4 text-text-secondary">
							{ m.phone || '—' }
						</td>

						<td class="px-6 py-4 text-text-secondary">
							{ getOrgLabel( m.organization ) }
						</td>

						<td class="px-6 py-4 text-center">
							{#if m.is_representative}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-muted text-accent">
									Sí
								</span>
							{:else}
								<span class="text-text-muted">—</span>
							{/if}
						</td>

						<td class="px-6 py-4 text-right">
							<div class="flex items-center justify-end gap-1.5">
								<button
									onclick={ () => onEdit( m ) }
									class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300 cursor-pointer"
									title="Editar miembro"
								>
									<Edit2 size={ 15 } />
								</button>

								<button
									onclick={ () => onDelete( m ) }
									class="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
									title="Eliminar miembro"
								>
									<Trash2 size={ 15 } />
								</button>
							</div>
						</td>
					</tr>
				{/each}

				<!-- Formulario en línea para agregar un nuevo miembro -->
				<FamilyMemberRowForm onSubmit={ onAdd } isSaving={ isSaving } />

				{#if saveError}
					<tr class="bg-red-500/5 select-none">
						<td colspan="6" class="px-6 py-3 text-sm text-red-500 text-right font-medium">
							{ saveError }
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
