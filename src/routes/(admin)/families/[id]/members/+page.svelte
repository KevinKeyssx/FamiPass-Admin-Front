<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { invalidate }       from '$app/navigation';

	import { ArrowLeft, Users, Plus, Crown, User as UserIcon, Trash2, Edit2 } from '@lucide/svelte';

	import type {
        Family,
        FamilyMember,
        CommunityOrganization
    }                       from '$lib/types/index.js';
	import Button           from '$lib/components/ui/Button.svelte';
	import Modal            from '$lib/components/ui/Modal.svelte';
	import FamilyMemberForm from '../../components/FamilyMemberForm.svelte';
	import { getOrgLabel }  from '../../utils/constants.js';


	interface Props {
		data: {
			family  : Family | null;
			members : FamilyMember[];
		};
	}


	let { data }: Props = $props();


	let showFormModal  = $state( false );
	let isDeleting     = $state( false );
	let saveError      = $state<string | null>( null );
	let deleteError    = $state<string | null>( null );

	let selectedMember = $state<FamilyMember | null>( null );
	let deleteModal    = $state<{
		open : boolean;
		id   : string | null;
		name : string;
	}>( {
		open : false,
		id   : null,
		name : ''
	} );


	function openCreateModal(): void {
		saveError = null;
		selectedMember = null;
		showFormModal = true;
	}

	function openEditModal( member: FamilyMember ): void {
		saveError = null;
		selectedMember = member;
		showFormModal = true;
	}

	async function handleSaveMember( memberData: {
		full_name         : string;
		rut               : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
	} ): Promise<void> {
		saveError = null;

		const formData = new FormData();
		formData.append( 'full_name', memberData.full_name );
		formData.append( 'rut', memberData.rut );
		formData.append( 'phone', memberData.phone );
		formData.append( 'organization', memberData.organization );
		formData.append( 'is_representative', String( memberData.is_representative ) );

		const actionUrl = selectedMember ? `?memberId=${ selectedMember.id }&/save` : '?/save';

		try {
			const response = await fetch( actionUrl, {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:family-members' );

				showFormModal = false;
				selectedMember = null;
			} else if ( result.type === 'failure' ) {
				saveError = ( result.data as any )?.error ?? 'Error al guardar el miembro.';
			} else {
				saveError = 'Ocurrió un error inesperado.';
			}
		} catch ( err: any ) {
			saveError = err.message;
		}
	}

	function openDeleteModal( member: FamilyMember ): void {
		deleteError = null;
		deleteModal = {
			open : true,
			id   : member.id,
			name : member.full_name
		};
	}

	async function confirmDelete(): Promise<void> {
		if ( !deleteModal.id ) return;

		isDeleting = true;
		deleteError = null;

		const formData = new FormData();
		formData.append( 'id', deleteModal.id );

		try {
			const response = await fetch( '?/delete', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:family-members' );

				deleteModal = {
					open : false,
					id   : null,
					name : ''
				};
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error ?? 'Error al eliminar miembro.';
			} else {
				deleteError = 'Ocurrió un error inesperado.';
			}
		} catch ( err: any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Miembros de la Familia — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a
				href="/families"
				class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300"
				aria-label="Volver"
			>
				<ArrowLeft size={ 20 } />
			</a>

			<div>
				<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
					Miembros Familiares
				</h1>
				<p class="text-sm text-text-secondary mt-1">
					Gestión de los miembros pertenecientes a la familia: <strong class="text-text-primary">{ data.family?.family_name }</strong>
				</p>
			</div>
		</div>

		<Button variant="primary" onclick={ openCreateModal }>
			<Plus size={ 18 } />
			Agregar Miembro
		</Button>
	</div>

	<!-- Listado de Miembros -->
	<div class="card overflow-hidden">
		{#if data.members.length === 0}
			<div class="flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
				<Users size={ 48 } class="mb-4 opacity-20" />
				<p class="text-sm font-medium">Esta familia no cuenta con miembros registrados.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-bg-surface-2 select-none">
							<th class="text-left px-6 py-4 font-semibold text-text-secondary">Nombre</th>
							<th class="text-left px-6 py-4 font-semibold text-text-secondary">RUT</th>
							<th class="text-left px-6 py-4 font-semibold text-text-secondary">Teléfono</th>
							<th class="text-left px-6 py-4 font-semibold text-text-secondary">Organización</th>
							<th class="text-center px-6 py-4 font-semibold text-text-secondary">Representante</th>
							<th class="text-right px-6 py-4 font-semibold text-text-secondary">Acciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.members as m}
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

								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-1.5">
										<button
											onclick={ () => openEditModal( m ) }
											class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300 cursor-pointer"
											title="Editar miembro"
										>
											<Edit2 size={ 15 } />
										</button>

										<button
											onclick={ () => openDeleteModal( m ) }
											class="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
											title="Eliminar miembro"
										>
											<Trash2 size={ 15 } />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Modal para Crear/Editar Miembro -->
<Modal
	open={ showFormModal }
	onClose={ () => showFormModal = false }
	title={ selectedMember ? 'Editar Miembro' : 'Agregar Miembro' }
>
	<FamilyMemberForm
		member={ selectedMember }
		onSubmit={ handleSaveMember }
		onCancel={ () => showFormModal = false }
		submitLabel={ selectedMember ? 'Guardar Cambios' : 'Agregar Miembro' }
	/>

	{#if saveError}
		<p class="mt-3 text-red-500 text-sm">{ saveError }</p>
	{/if}
</Modal>

<!-- Modal de Confirmación de Borrado -->
<Modal
	open={ deleteModal.open }
	onClose={ () => deleteModal.open = false }
	onConfirm={ confirmDelete }
	title="Eliminar Miembro Familiar"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar a <strong class="text-text-primary">"{ deleteModal.name }"</strong> de la familia?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer y desvinculará permanentemente al miembro de este grupo familiar.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
