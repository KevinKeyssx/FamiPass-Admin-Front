<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

    import { CalendarPlus, Search } from '@lucide/svelte';

	import type { EventConfig } from '$lib/types/index.js';
	import ViewSwitcher         from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination           from '$lib/components/shared/Pagination.svelte';
	import EventTable           from './components/EventTable.svelte';
	import EventCard            from './components/EventCard.svelte';
	import Button               from '$lib/components/ui/Button.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import DatePicker           from '$lib/components/ui/DatePicker.svelte';
	import Select               from '$lib/components/ui/Select.svelte';


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


    const statusOptions = [
		{ value: 'ALL',         label: 'Todos los estados' },
		{ value: 'DRAFT',       label: 'Borrador' },
		{ value: 'IN_PROGRESS', label: 'En Curso' },
		{ value: 'FINISHED',    label: 'Finalizado' },
		{ value: 'CANCELLED',   label: 'Cancelado' }
	];


    const verificationOptions = [
		{ value: 'ALL',   label: 'Todos' },
		{ value: 'TRUE',  label: 'Requerida' },
		{ value: 'FALSE', label: 'No Requerida' }
	];


    const minorsOptions = [
		{ value: 'ALL',   label: 'Todos' },
		{ value: 'TRUE',  label: 'Sí' },
		{ value: 'FALSE', label: 'No' }
	];


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


    function clearDateFilter(): void {
		searchDate = '';
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
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-(--text-primary)">Eventos</h1>
			<p class="text-(--text-secondary) mt-1 text-sm">Gestión completa de eventos de FamiPass</p>
		</div>

		<div class="flex items-center gap-3 self-end sm:self-auto">
			<ViewSwitcher />
			<a href="/events/form">
				<Button variant="primary">
					<CalendarPlus size={ 16 } />
					Nuevo Evento
				</Button>
			</a>
		</div>
	</div>

	<!-- Controls / Filters & Search Grid -->
	<div class="card p-5 space-y-4 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 rounded-2xl relative">
		<!-- First Row: Search Text & Date Picker -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Name Search -->
			<div class="relative">
				<Search size={ 16 } class="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
				<input
					type="text"
					bind:value={ searchQuery }
					placeholder="Buscar eventos por nombre..."
					onkeydown={ ( e ) => e.key === 'Enter' && handleFilterChange() }
					class="w-full pl-10 pr-24 py-2.5 rounded-xl border border-(--border)/60 transition-all duration-300
						bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted) text-sm
						focus:outline-none focus:border-(--accent) focus:ring-4 focus:ring-(--accent)/10"
				/>
				<button
					onclick={ handleFilterChange }
					class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold
						bg-(--accent) text-(--accent-text) hover:bg-(--accent-hover) transition-colors cursor-pointer"
				>
					Buscar
				</button>
			</div>

			<!-- Date Search -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-(--text-secondary) font-medium whitespace-nowrap">Fecha:</span>
				<div class="flex-1">
					<DatePicker
						bind:value={ searchDate }
					/>
				</div>
				{#if searchDate }
					<button
						onclick={ clearDateFilter }
						class="text-xs text-red-500 hover:underline font-semibold cursor-pointer shrink-0"
					>
						Limpiar
					</button>
				{/if}
			</div>
		</div>

		<!-- Second Row: Advanced Select Filters -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
			<!-- Status Selector -->
			<div class="flex flex-col gap-1.5 w-full">
				<span class="text-xs text-(--text-secondary) font-semibold uppercase tracking-wider">Estado del Evento</span>
				<Select
					bind:value={ selectedStatus }
					options={ statusOptions }
					placeholder="Todos los estados"
				/>
			</div>

			<!-- Verification Required Selector -->
			<div class="flex flex-col gap-1.5 w-full">
				<span class="text-xs text-(--text-secondary) font-semibold uppercase tracking-wider">Verificación Req.</span>
				<Select
					bind:value={ selectedVerification }
					options={ verificationOptions }
					placeholder="Todos"
				/>
			</div>

			<!-- Detect By Minors Selector -->
			<div class="flex flex-col gap-1.5 w-full">
				<span class="text-xs text-(--text-secondary) font-semibold uppercase tracking-wider">Detecta Menores</span>
				<Select
					bind:value={ selectedMinors }
					options={ minorsOptions }
					placeholder="Todos"
				/>
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-end gap-2.5">
				<Button
					variant="secondary"
					size="sm"
					class="w-full"
					onclick={ clearAllFilters }
				>
					Limpiar Filtros
				</Button>
			</div>
		</div>
	</div>

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
