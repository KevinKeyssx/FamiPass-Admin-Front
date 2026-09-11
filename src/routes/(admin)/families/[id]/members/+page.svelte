<script lang="ts">
	import { deserialize }  from '$app/forms';
	import { invalidate }   from '$app/navigation';
	import { page }         from '$app/state';

	import type {
		Family,
		FamilyMember,
		CommunityOrganization,
		FamilyMemberRole
	}                           from '$lib/types/index.js';
	import ViewSwitcher         from '$lib/components/shared/ViewSwitcher.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import FamilyMemberForm     from '../../components/FamilyMemberForm.svelte';
	import FamilyMemberTable    from './components/FamilyMemberTable.svelte';
	import FamilyMemberCard     from './components/FamilyMemberCard.svelte';
	import ButtonBack           from '$lib/components/ui/ButtonBack.svelte';
	import ButtonCreate         from '$lib/components/ui/ButtonCreate.svelte';


	interface Props {
		data: {
			family  : Family | null;
			members : FamilyMember[];
		};
	}


	let { data }: Props = $props();


	const currentView  = $derived( page.url.searchParams.get( 'view' ) || 'card' );

	let showFormModal  = $state( false );
	let isSaving       = $state( false );
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


	function scrollToForm(): void {
		const input = document.getElementById( 'member-full-name' ) || document.querySelector( 'input[placeholder="Ej: Juan Pérez"]' );

        if ( input ) {
			input.scrollIntoView( { behavior : 'smooth', block : 'center' } );
			( input as HTMLInputElement ).focus();
		}
	}

	function openEditModal( member: FamilyMember ): void {
		saveError = null;
		selectedMember = member;
		showFormModal = true;
	}

	async function handleSaveMember( memberData: {
		full_name         : string;
		rut               : string;
		email             : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
		role              : FamilyMemberRole;
	}): Promise<boolean> {
		saveError = null;
		isSaving = true;

		const formData = new FormData();
		formData.append( 'full_name', memberData.full_name );
		formData.append( 'rut', memberData.rut );
		formData.append( 'email', memberData.email );
		formData.append( 'phone', memberData.phone );
		formData.append( 'organization', memberData.organization );
		formData.append( 'is_representative', String( memberData.is_representative ) );
		formData.append( 'role', memberData.role );

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
				return true;
			} else if ( result.type === 'failure' ) {
				saveError = ( result.data as any )?.error ?? 'Error al guardar el miembro.';
				return false;
			} else {
				saveError = 'Ocurrió un error inesperado.';
				return false;
			}
		} catch ( err: any ) {
			saveError = err.message;
			return false;
		} finally {
			isSaving = false;
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
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/families" />

			<div class="space-y-0.5">
				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					Miembros Familiares
				</h1>
				<p class="text-xs text-text-secondary">
					Gestión de los miembros pertenecientes a la familia: <strong class="text-text-primary">{ data.family?.family_name }</strong>
				</p>
			</div>
		</div>

		<div class="flex items-center justify-between sm:justify-end gap-2.5 relative z-10 shrink-0 w-full sm:w-auto">
			<ViewSwitcher />

			<ButtonCreate onclick={ scrollToForm } label="Miembro" prefix="Agregar" />
		</div>
	</div>

	<!-- Listado / Vista de datos -->
	{#if currentView === 'table'}
		<FamilyMemberTable
			members={ data.members }
			onEdit={ openEditModal }
			onDelete={ openDeleteModal }
			onAdd={ handleSaveMember }
			isSaving={ isSaving }
			saveError={ saveError }
		/>
	{:else}
		<FamilyMemberCard
			members={ data.members }
			onEdit={ openEditModal }
			onDelete={ openDeleteModal }
			onAdd={ handleSaveMember }
			isSaving={ isSaving }
			saveError={ saveError }
		/>
	{/if}
</div>

<!-- Modal para Editar Miembro -->
<Modal
	open={ showFormModal }
	onClose={ () => { showFormModal = false; } }
	title="Editar Miembro"
	size="lg"
>
	<FamilyMemberForm
		member={ selectedMember }
		onSubmit={ handleSaveMember }
		onCancel={ () => { showFormModal = false; } }
		submitLabel="Guardar Cambios"
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
