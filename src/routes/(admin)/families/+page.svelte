<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

	import type { Family } from '$lib/types/index.js';
	import ViewSwitcher    from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination      from '$lib/components/shared/Pagination.svelte';
	import FamilyTable     from './components/FamilyTable.svelte';
	import FamilyCard      from './components/FamilyCard.svelte';
	import Button          from '$lib/components/ui/Button.svelte';
	import Modal           from '$lib/components/ui/Modal.svelte';
	import SearchInput     from '$lib/components/ui/SearchInput.svelte';
	import ButtonCreate    from '$lib/components/ui/ButtonCreate.svelte';

	interface Props {
		data : {
			families : Family[];
			count    : number;
		};
	}

	let { data } : Props = $props();


	const currentView = $derived( page.url.searchParams.get( 'view' ) || 'card' );


	let searchQuery = $state( page.url.searchParams.get( 'search' ) || '' );
	let deleteError = $state<string | null>( null );
	let isDeleting  = $state( false );
	let deleteModal = $state<{
		open : boolean;
		id   : string | null;
		name : string;
	}>( {
		open : false,
		id   : null,
		name : ''
	} );


	function handleSearch( query? : string ) : void {
		const targetQuery  = query !== undefined ? query : searchQuery;
		const currentParam = page.url.searchParams.get( 'search' ) || '';
		const trimmedQuery = targetQuery.trim();

		if ( trimmedQuery === currentParam ) {
			return;
		}

		const url = new URL( page.url );

		if ( trimmedQuery ) {
			url.searchParams.set( 'search', trimmedQuery );
		} else {
			url.searchParams.delete( 'search' );
		}

		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}

	function clearFilters(): void {
		searchQuery = '';

		const url = new URL( page.url );
		url.searchParams.delete( 'search' );
		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}

	function openDeleteModal( family: Family ): void {
		deleteError = null;
		deleteModal = {
			open : true,
			id   : family.id,
			name : family.family_name
		};
	}

	async function confirmDelete(): Promise<void> {
		if ( !deleteModal.id ) return;

		isDeleting  = true;
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
				await invalidate( 'app:families' );

				deleteModal = {
					open : false,
					id   : null,
					name : ''
				};
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error || 'Error al eliminar familia';
			} else {
				deleteError = 'Ocurrió un error inesperado';
			}
		} catch ( err: any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Familias — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
				Familias
			</h1>
			<p class="text-xs text-(--text-secondary) mt-0.5">
				Administra y gestiona los grupos familiares y sus miembros
			</p>
		</div>

		<div class="flex items-center justify-between sm:justify-end gap-2.5 relative z-10 shrink-0 w-full sm:w-auto">
			<ViewSwitcher />

			<ButtonCreate href="/families/form" label="Familia" prefix="Nueva" />
		</div>
	</div>

	<!-- Filtros -->
	<div class="form-card !p-4 !space-y-0 flex flex-col md:flex-row gap-4 items-center justify-between">
		<div class="w-full md:max-w-md">
			<SearchInput
				bind:value={ searchQuery }
				onSearch={ handleSearch }
				placeholder="Buscar por nombre de familia..."
			/>
		</div>

		{#if searchQuery}
			<Button
				variant="secondary"
				onclick={ clearFilters }
				class="w-full md:w-auto border border-border hover:bg-zinc-100 dark:hover:bg-zinc-900"
			>
				Limpiar Filtros
			</Button>
		{/if}
	</div>

	<!-- Listado / Vista de datos -->
	{#if currentView === 'table'}
		<FamilyTable families={ data.families } onDelete={ openDeleteModal } />
	{:else}
		<FamilyCard families={ data.families } onDelete={ openDeleteModal } />
	{/if}

	<!-- Paginación -->
	{#if data.count > 0}
		<Pagination count={ data.count } />
	{/if}
</div>

<!-- Modal de Eliminación -->
<Modal
	open={ deleteModal.open }
	onClose={ () => deleteModal.open = false }
	onConfirm={ confirmDelete }
	title="Eliminar Familia"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar la familia <strong class="text-text-primary">"{ deleteModal.name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer. Se eliminará de forma permanente el grupo familiar y desvinculará a todos sus miembros asociados.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
