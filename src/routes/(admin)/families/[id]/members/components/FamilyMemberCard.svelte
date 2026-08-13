<script lang="ts">
	import { Users, Crown, User as UserIcon, Edit2, Trash2, Phone, Landmark, CreditCard } from '@lucide/svelte';
	import type { FamilyMember, CommunityOrganization }                             from '$lib/types/index.js';
	import { getOrgLabel }                                                           from '../../../utils/constants.js';
	import FamilyMemberRowForm                                                       from './FamilyMemberRowForm.svelte';

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

<div class="space-y-6">
	<!-- Grid de Tarjetas -->
	{#if members.length === 0}
		<div class="card flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2 border border-border/60 rounded-2xl">
			<Users size={ 48 } class="mb-4 opacity-20" />
			<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
			{#each members as m}
				<div class="card p-5 flex flex-col justify-between gap-4 bg-linear-to-b from-bg-surface to-bg-surface-2 border border-border/60 hover:border-accent hover:scale-[1.01] hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
					<!-- Header: Nombre y Acciones -->
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2.5 truncate">
							<div class="w-9 h-9 rounded-xl bg-bg-surface-2 border border-border flex items-center justify-center shrink-0">
								{#if m.is_representative}
									<Crown size={ 16 } class="text-accent" />
								{:else}
									<UserIcon size={ 16 } class="text-text-muted" />
								{/if}
							</div>
							<div class="truncate">
								<h3 class="font-bold text-sm text-text-primary truncate" title={ m.full_name }>
									{ m.full_name }
								</h3>
								{#if m.is_representative}
									<span class="inline-flex items-center text-[10px] font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded-md mt-0.5 select-none">
										Representante
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-1 shrink-0">
							<button
								onclick={ () => onEdit( m ) }
								class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-200 cursor-pointer"
								title="Editar miembro"
							>
								<Edit2 size={ 14 } />
							</button>

							<button
								onclick={ () => onDelete( m ) }
								class="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
								title="Eliminar miembro"
							>
								<Trash2 size={ 14 } />
							</button>
						</div>
					</div>

					<!-- Body: Detalles -->
					<div class="space-y-2.5 text-xs border-t border-border/40 pt-3">
						<div class="flex items-center gap-2 text-text-secondary">
							<CreditCard size={ 14 } class="text-text-muted shrink-0" />
							<span class="font-semibold w-12 text-text-muted">RUT:</span>
							<span class="font-mono text-text-primary">{ m.rut }</span>
						</div>

						<div class="flex items-center gap-2 text-text-secondary">
							<Phone size={ 14 } class="text-text-muted shrink-0" />
							<span class="font-semibold w-12 text-text-muted">Teléfono:</span>
							<span class="text-text-primary">{ m.phone || '—' }</span>
						</div>

						<div class="flex items-center gap-2 text-text-secondary">
							<Landmark size={ 14 } class="text-text-muted shrink-0" />
							<span class="font-semibold w-12 text-text-muted">Org:</span>
							<span class="text-text-primary truncate" title={ getOrgLabel( m.organization ) }>
								{ getOrgLabel( m.organization ) }
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Formulario en línea al final de la página (estilo Fila de Tabla) -->
	<div class="card p-5 bg-linear-to-b from-bg-surface to-bg-surface-2 border border-border/60 rounded-2xl">
		<h3 class="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 select-none">
			<Users size={ 16 } class="text-accent" />
			Agregar Nuevo Miembro
		</h3>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bg-surface-2/50 select-none">
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/4">Nombre</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/5">RUT</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/6">Teléfono</th>
						<th class="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/5">Organización</th>
						<th class="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/12">Representante</th>
						<th class="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/80 w-1/10">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<FamilyMemberRowForm onSubmit={ onAdd } isSaving={ isSaving } />

					{#if saveError}
						<tr class="bg-red-500/5 select-none">
							<td colspan="6" class="px-4 py-2 text-sm text-red-500 text-right font-medium">
								{ saveError }
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
