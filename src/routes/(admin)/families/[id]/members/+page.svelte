<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { invalidate }       from '$app/navigation';
	import { page }             from '$app/state';

	import { ArrowLeft, Users, Plus, Crown, User as UserIcon, Trash2, Edit2 } from '@lucide/svelte';

	import type {
		Family,
		FamilyMember,
		CommunityOrganization
	}                           from '$lib/types/index.js';
	import ViewSwitcher         from '$lib/components/shared/ViewSwitcher.svelte';
	import Button               from '$lib/components/ui/Button.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import FamilyMemberForm     from '../../components/FamilyMemberForm.svelte';
	import FamilyMemberTable    from './components/FamilyMemberTable.svelte';
	import FamilyMemberCard     from './components/FamilyMemberCard.svelte';


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
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
	} ): Promise<boolean> {
		saveError = null;
		isSaving = true;

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

		<div class="flex items-center gap-3">
			<ViewSwitcher />

			<Button variant="primary" onclick={ scrollToForm }>
				<Plus size={ 18 } />
				Agregar Miembro
			</Button>
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
