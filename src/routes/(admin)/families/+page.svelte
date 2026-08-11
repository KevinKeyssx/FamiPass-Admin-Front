<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

	import { Plus, Search } from '@lucide/svelte';

	import type { Family }  from '$lib/types/index.js';
	import ViewSwitcher     from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination       from '$lib/components/shared/Pagination.svelte';
	import FamilyTable      from './components/FamilyTable.svelte';
	import FamilyCard       from './components/FamilyCard.svelte';
	import Button           from '$lib/components/ui/Button.svelte';
	import Modal            from '$lib/components/ui/Modal.svelte';


	interface Props {
		data: {
			families : Family[];
			count    : number;
		};
	}


	let { data }: Props = $props();


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


	function handleSearch(): void {
		const url = new URL( page.url );

		if ( searchQuery.trim() ) {
			url.searchParams.set( 'search', searchQuery.trim() );
		} else {
			url.searchParams.delete( 'search' );
		}

		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}

	function handleSearchInput( e: Event ): void {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		handleSearch();
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
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
				Familias
			</h1>
			<p class="text-sm text-text-secondary mt-1">
				Administra y gestiona los grupos familiares y sus miembros
			</p>
		</div>

		<div class="flex items-center gap-3">
			<ViewSwitcher />

			<a href="/families/form">
				<Button variant="primary">
					<Plus size={ 18 } />
					Nueva Familia
				</Button>
			</a>
		</div>
	</div>

	<!-- Filtros -->
	<div class="p-4 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 flex flex-col md:flex-row gap-4 items-center justify-between">
		<div class="relative w-full md:max-w-md">
			<Search size={ 16 } class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
			<input
				type="text"
				placeholder="Buscar por nombre de familia..."
				value={ searchQuery }
				oninput={ handleSearchInput }
				class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-bg-surface-2 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-300"
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
