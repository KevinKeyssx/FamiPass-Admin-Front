<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

	import type { EventConfig } from '$lib/types/index.js';
	import ViewSwitcher         from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination           from '$lib/components/shared/Pagination.svelte';
	import EventTable           from './components/EventTable.svelte';
	import EventCard            from './components/EventCard.svelte';
	import EventFilters         from './components/EventFilters.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import ButtonCreate         from '$lib/components/ui/ButtonCreate.svelte';


    interface Props {
		data: {
			events : EventConfig[];
			count  : number;
		};
	}


    let { data } : Props = $props();


    let searchQuery             = $state( page.url.searchParams.get( 'search' ) || '' );
	let searchDate              = $state( page.url.searchParams.get( 'date' ) || '' );
	let selectedStatus          = $state( page.url.searchParams.get( 'status' ) || 'ALL' );
	let selectedVerification    = $state( page.url.searchParams.get( 'verification' ) || 'ALL' );
	let selectedMinors          = $state( page.url.searchParams.get( 'minors' ) || 'ALL' );
	let deleteError             = $state<string | null>( null );
    let isDeleting              = $state( false );
    let deleteModal             = $state<{
		open : boolean;
		id   : string | null;
		name : string;
	}>({
        open : false,
		id   : null,
		name : ''
	});


    const currentView = $derived( page.url.searchParams.get( 'view' ) || 'card' );





    $effect( () => {
		const urlDate         = page.url.searchParams.get( 'date' ) || '';
		const urlStatus       = page.url.searchParams.get( 'status' ) || 'ALL';
		const urlVerification = page.url.searchParams.get( 'verification' ) || 'ALL';
		const urlMinors       = page.url.searchParams.get( 'minors' ) || 'ALL';

		if (
			searchDate !== urlDate ||
			selectedStatus !== urlStatus ||
			selectedVerification !== urlVerification ||
			selectedMinors !== urlMinors
		) {
			handleFilterChange();
		}
	});


    function handleFilterChange(): void {
		const url = new URL( page.url );

		if ( searchQuery.trim() ) {
			url.searchParams.set( 'search', searchQuery.trim() );
		} else {
			url.searchParams.delete( 'search' );
		}

		if ( searchDate ) {
			url.searchParams.set( 'date', searchDate );
		} else {
			url.searchParams.delete( 'date' );
		}

		if ( selectedStatus && selectedStatus !== 'ALL' ) {
			url.searchParams.set( 'status', selectedStatus );
		} else {
			url.searchParams.delete( 'status' );
		}

		if ( selectedVerification && selectedVerification !== 'ALL' ) {
			url.searchParams.set( 'verification', selectedVerification );
		} else {
			url.searchParams.delete( 'verification' );
		}

		if ( selectedMinors && selectedMinors !== 'ALL' ) {
			url.searchParams.set( 'minors', selectedMinors );
		} else {
			url.searchParams.delete( 'minors' );
		}

		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}





    function clearAllFilters(): void {
		searchQuery          = '';
		searchDate           = '';
		selectedStatus       = 'ALL';
		selectedVerification = 'ALL';
		selectedMinors       = 'ALL';

		const url = new URL( page.url );

        url.searchParams.delete( 'search' );
		url.searchParams.delete( 'date' );
		url.searchParams.delete( 'status' );
		url.searchParams.delete( 'verification' );
		url.searchParams.delete( 'minors' );
		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}


    function openDeleteModal( event: EventConfig ): void {
		deleteError = null;
		deleteModal = {
			open : true,
			id   : event.id,
			name : event.event_name
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
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:events' );

                deleteModal = {
					open : false,
					id   : null,
					name : ''
				};
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error || 'Error al eliminar evento';
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
	<title>Eventos — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
				Eventos
			</h1>
			<p class="text-xs text-(--text-secondary) mt-0.5">
				Gestión completa de eventos de FamiPass
			</p>
		</div>

		<div class="flex items-center justify-between sm:justify-end gap-2.5 relative z-10 shrink-0 w-full sm:w-auto">
			<ViewSwitcher />

			<ButtonCreate href="/events/form" label="Evento" prefix="Crear" />
		</div>
	</div>

	<!-- Controls / Filters & Search Grid -->
	<EventFilters
		bind:searchQuery={ searchQuery }
		bind:searchDate={ searchDate }
		bind:selectedStatus={ selectedStatus }
		bind:selectedVerification={ selectedVerification }
		bind:selectedMinors={ selectedMinors }
		onSearch={ handleFilterChange }
		onClearAll={ clearAllFilters }
	/>

	<!-- Event List View (Table or Card) -->
	<div class="flex flex-col">
		{#if currentView === 'table' }
			<EventTable events={ data.events } onDelete={ openDeleteModal } />
		{:else}
			<EventCard events={ data.events } onDelete={ openDeleteModal } />
		{/if}

		<!-- Reusable Pagination Component -->
		<Pagination count={ data.count } />
	</div>
</div>

<!-- Delete modal -->
<Modal
	open={ deleteModal.open }
	title="Eliminar evento"
	onClose={() => { deleteModal = { open: false, id: null, name: '' }; deleteError = null; }}
	onConfirm={ confirmDelete }
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar el evento <strong class="text-text-primary">"{ deleteModal.name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer.</p>
	{#if deleteError }
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
