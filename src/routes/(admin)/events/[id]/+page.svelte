<script lang="ts">
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';
	import { deserialize }      from '$app/forms';

    import { ArrowLeft, Pencil, CalendarDays, Users, Search, Plus } from '@lucide/svelte';

    import { isEventExpired }   from '$lib/utils/date.js';


    import type {
		EventConfig,
		FamilyEvent,
		Order,
		Family
	}                   from '$lib/types/index.js';
	import TicketVerse  from '$lib/components/tickets/TicketVerse.svelte';
	import StatusBadge  from '$lib/components/ui/StatusBadge.svelte';
	import Button       from '$lib/components/ui/Button.svelte';
	import Modal        from '$lib/components/ui/Modal.svelte';
	import Pagination   from '$lib/components/shared/Pagination.svelte';


	interface EventDetail extends EventConfig {
		family_events: Array<FamilyEvent & { orders: Order[] }>;
	}


	interface Props {
		data: {
			event         : EventDetail;
			families      : Family[];
			familiesCount : number;
		};
	}


	let { data }: Props  = $props();
	let search           = $state( '' );
	let addModalOpen     = $state( false );
	let isAdding         = $state( false );
	let selectedFamilyId = $state<string | null>( null );
	let modalSearch      = $state( page.url.searchParams.get( 'search' ) || '' );
	let addError         = $state<string | null>( null );

	const isExpired = $derived( data.event.expires_at ? isEventExpired( data.event.expires_at ) : false );



	const filteredFamilyEvents = $derived(
		( data.event.family_events ?? [] ).filter( ( fe ) =>
			!search.trim() || fe.family?.family_name?.toLowerCase().includes( search.toLowerCase() )
		)
	);


	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', { day: '2-digit', month: 'long', year: 'numeric' } );
	}


	function handleModalSearch(): void {
		const url = new URL( page.url );

		if ( modalSearch.trim() ) {
			url.searchParams.set( 'search', modalSearch.trim() );
		} else {
			url.searchParams.delete( 'search' );
		}

		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}


	function handleModalSearchInput( e: Event ): void {
		const target = e.target as HTMLInputElement;
		modalSearch = target.value;
		handleModalSearch();
	}


	async function confirmAdd(): Promise<void> {
		if ( !selectedFamilyId ) {
			addError = 'Por favor selecciona una familia';
			return;
		}

		isAdding = true;
		addError = null;

		const formData = new FormData();
		formData.append( 'familyId', selectedFamilyId );

		try {
			const response = await fetch( '?/addFamily', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:event' );
				addModalOpen     = false;
				selectedFamilyId = null;
			} else if ( result.type === 'failure' ) {
				addError = ( result.data as any )?.error || 'Error al asociar familia';
			} else {
				addError = 'Ocurrió un error inesperado';
			}
		} catch ( err: any ) {
			addError = err.message;
		} finally {
			isAdding = false;
		}
	}


	const staffUrl = 'http://localhost:5174';
</script>

<svelte:head>
	<title>{ data.event.event_name } — FamiPass Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
		<div class="flex items-start gap-3">
			<a
				href="/events"
				class="mt-1 p-2 rounded-xl text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-muted) transition-all shrink-0"
				aria-label="Volver"
			>
				<ArrowLeft size={ 20 } />
			</a>

			<div>
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-2xl font-bold text-(--text-primary)">{ data.event.event_name }</h1>

					<StatusBadge status={ data.event.status } />
				</div>

				<p class="text-sm text-(--text-secondary) mt-1 flex items-center gap-1.5">
					<CalendarDays size={ 14 } />
					{ formatDate( data.event.event_date ) }
				</p>
			</div>
		</div>

		<a href="/events/form?id={ data.event.id }">
			<Button variant="secondary">
				<Pencil size={ 15 } />
				Editar
			</Button>
		</a>
	</div>

	{#if isExpired}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
			<span>⚠️</span>
			<div>
				<p class="font-bold">Este evento ha expirado (Fin Canje: { formatDate( data.event.expires_at || '' ) }).</p>
				<p class="text-xs">No se pueden asociar ni desasociar familias, ni gestionar órdenes para este evento.</p>
			</div>
		</div>
	{/if}

	<!-- Event meta -->

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		{#each [
			{ label: 'Lím. miembros',    value: data.event.max_family_members   ?? '—' },
			{ label: 'Lím. invitados',   value: data.event.max_guests_per_family ?? '—' },
			{ label: 'Detecta menores',  value: data.event.detect_by_minors ? 'Sí' : 'No' },
			{ label: 'Verif. invitados', value: data.event.require_guest_verification ? 'Sí' : 'No' }
		] as meta}
			<div class="card p-4">
				<p class="text-xs text-(--text-muted) mb-1">{ meta.label }</p>
				<p class="font-semibold text-(--text-primary)">{ meta.value }</p>
			</div>
		{/each}
	</div>

	<!-- Family tickets section -->
	<div>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
			<div class="flex items-center gap-4 flex-wrap">
				<div class="flex items-center gap-2">
					<Users size={ 18 } class="text-(--accent)" />

					<h2 class="text-lg font-semibold text-(--text-primary)">
						Tickets familiares

						<span class="text-sm font-normal text-(--text-muted) ml-1">
							({ data.event.family_events?.length ?? 0 })
						</span>
					</h2>
				</div>

				{#if !isExpired}
					<Button variant="secondary" onclick={ () => { addModalOpen = true; addError = null; selectedFamilyId = null; } }>
						<Plus size={ 16 } />
						Asociar Familia
					</Button>
				{/if}
			</div>


			<div class="relative max-w-xs w-full">
				<Search size={ 15 } class="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />

				<input
					type="search"
					bind:value={ search }
					placeholder="Buscar familia..."
					class="w-full pl-9 pr-4 py-2 rounded-xl border border-(--border)
                        bg-(--bg-surface-2) text-(--text-primary)
                        placeholder:text-(--text-muted) text-sm
                        focus:outline-none focus:border-(--border-focus) focus:ring-2 focus:ring-(--accent)/20
                        transition-all"
				/>
			</div>
		</div>

		{#if filteredFamilyEvents.length === 0}
			<div class="card p-12 flex flex-col items-center text-(--text-muted)">
				<Users size={ 48 } class="mb-3 opacity-30" />

				<p class="text-sm">
					{ search ? 'No se encontraron familias con ese nombre.' : 'No hay familias registradas para este evento.' }
				</p>
			</div>
		{:else}
			<div class="flex flex-wrap gap-6">
				{#each filteredFamilyEvents as fe}
					<TicketVerse
						familyEvent={ fe }
						order={ fe.orders?.[0] ?? null }
						{ staffUrl }
						{ isExpired }
					/>
				{/each}
			</div>

		{/if}
	</div>
</div>

<!-- Modal de Asociación -->
<Modal
	open={ addModalOpen }
	onClose={ () => addModalOpen = false }
	onConfirm={ confirmAdd }
	title="Asociar Familia al Evento"
	confirmLabel="Asociar"
	loading={ isAdding }
>
	<div class="space-y-4">
		<p class="text-sm text-(--text-muted)">Selecciona una familia para asociarla a este evento. No se mostrarán familias que ya estén asociadas.</p>

		<!-- Buscador dentro del modal -->
		<div class="relative">
			<Search size={ 15 } class="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
			<input
				type="text"
				placeholder="Buscar familia..."
				value={ modalSearch }
				oninput={ handleModalSearchInput }
				class="w-full pl-9 pr-4 py-2 rounded-xl border border-(--border)
				       bg-(--bg-surface-2) text-(--text-primary)
				       placeholder:text-(--text-muted) text-sm
				       focus:outline-none focus:border-(--border-focus) focus:ring-2 focus:ring-(--accent)/20
				       transition-all"
			/>
		</div>

		<!-- Listado de familias disponibles -->
		<div class="max-h-60 overflow-y-auto border border-(--border) rounded-xl divide-y divide-(--border) bg-(--bg-surface-2)">
			{#each data.families as family}
				<button
					type="button"
					class="w-full text-left px-4 py-3 text-sm hover:bg-(--bg-surface) transition-colors flex items-center justify-between { selectedFamilyId === family.id ? 'bg-(--accent)/10 text-(--accent) font-semibold' : 'text-(--text-primary)' }"
					onclick={ () => selectedFamilyId = family.id }
				>
					<span>{ family.family_name }</span>
					{#if selectedFamilyId === family.id}
						<span class="text-xs font-bold uppercase">Seleccionado</span>
					{/if}
				</button>
			{:else}
				<p class="p-4 text-center text-sm text-(--text-muted)">No hay familias disponibles.</p>
			{/each}
		</div>

		<!-- Paginación dentro del modal -->
		{#if data.familiesCount > 0}
			<div class="pt-2">
				<Pagination count={ data.familiesCount } />
			</div>
		{/if}

		{#if addError}
			<p class="text-red-500 text-sm font-medium">{ addError }</p>
		{/if}
	</div>
</Modal>
