<script lang="ts">
	import { invalidate }   from '$app/navigation';
	import { deserialize }  from '$app/forms';

	import {
		Pencil,
		CalendarDays,
		Users,
		Plus,
		ShoppingBag,
		Check
	}                                   from '@lucide/svelte';
	import { Checkbox as BitsCheckbox } from 'bits-ui';

	import type {
		EventConfig,
		FamilyEvent,
		Order,
		ExistingFamilyLookup
	}                                           from '$lib/types/index.js';
	import TicketVerse                          from '$lib/components/tickets/TicketVerse.svelte';
	import StatusBadge                          from '$lib/components/ui/StatusBadge.svelte';
	import Button                               from '$lib/components/ui/Button.svelte';
	import Modal                                from '$lib/components/ui/Modal.svelte';
	import ButtonBack                           from '$lib/components/ui/ButtonBack.svelte';
	import SearchInput                          from '$lib/components/ui/SearchInput.svelte';
	import { isEventExpired, hasEventStarted }  from '$lib/utils/date.js';


	interface EventDetail extends EventConfig {
		family_events : Array<FamilyEvent & { orders: Order[] }>;
	}


	interface Props {
		data : {
			event             : EventDetail;
			availableFamilies : ExistingFamilyLookup[];
			isSuperAdmin      : boolean;
		};
	}


	let { data } : Props    = $props();
	let search              = $state( '' );
	let addModalOpen        = $state( false );
	let isAdding            = $state( false );
	let selectedFamilyIds   = $state<string[]>( [] );
	let modalSearch         = $state( '' );
	let addError            = $state<string | null>( null );


    const isExpired     = $derived( data.event.expires_at ? isEventExpired( data.event.expires_at ) : false );
	const hasStarted    = $derived(
        data.event.event_date ? hasEventStarted( data.event.event_date ) : false
	);
    const canEdit               = $derived( data.isSuperAdmin || !hasStarted );
	const filteredFamilyEvents  = $derived(
		( data.event.family_events ?? [] ).filter( ( fe ) => {
			if ( !search.trim() ) return true;

            const term          = search.toLowerCase();
			const familyName    = fe.family?.family_name?.toLowerCase() || '';
			const shortCode     = fe.short_code?.toLowerCase() || '';

            return familyName.includes( term ) || shortCode.includes( term );
		} )
	);


	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', {
            day   : '2-digit',
            month : 'long',
            year  : 'numeric'
        } );
	}


	const modalFilteredFamilies = $derived.by( () => {
		if ( !modalSearch.trim() ) {
			return data.availableFamilies;
		}

		const term = modalSearch.toLowerCase().trim();
		return data.availableFamilies.filter( ( f ) =>
			f.family_name.toLowerCase().includes( term ) ||
			String( f.code ).includes( term )
		);
	} );


	function toggleFamilySelection( familyId : string ) : void {
		if ( selectedFamilyIds.includes( familyId ) ) {
			selectedFamilyIds = selectedFamilyIds.filter( ( id ) => id !== familyId );
		} else {
			selectedFamilyIds = [ ...selectedFamilyIds, familyId ];
		}
	}

	function selectAllVisible() : void {
		const newIds = new Set( selectedFamilyIds );
		for ( const f of modalFilteredFamilies ) {
			newIds.add( f.id );
		}
		selectedFamilyIds = Array.from( newIds );
	}

	function clearAllSelection() : void {
		selectedFamilyIds = [];
	}

	async function confirmAdd() : Promise<void> {
		if ( selectedFamilyIds.length === 0 ) {
			addError = 'Por favor selecciona al menos una familia';
			return;
		}

		isAdding = true;
		addError = null;

		const formData = new FormData();
		for ( const famId of selectedFamilyIds ) {
			formData.append( 'familyIds', famId );
		}

		try {
			const response = await fetch( '?/addFamily', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:event' );
				addModalOpen      = false;
				selectedFamilyIds = [];
				modalSearch       = '';
			} else if ( result.type === 'failure' ) {
				addError = ( result.data as any )?.error || 'Error al asociar familias';
			} else {
				addError = 'Ocurrió un error inesperado';
			}
		} catch ( err : any ) {
			addError = err.message;
		} finally {
			isAdding = false;
		}
	}
</script>

<svelte:head>
	<title>{ data.event.event_name } — FamiPass Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/events" />

			<div class="space-y-1">
				<div class="flex items-center gap-3 flex-wrap">
					<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight leading-none">
						{ data.event.event_name }
					</h1>

					<StatusBadge status={ data.event.status } />
				</div>

				<p class="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
					<CalendarDays size={ 14 } />
					{ formatDate( data.event.event_date ) }
				</p>
			</div>
		</div>

		<div class="flex gap-3 relative z-10 shrink-0">
			{#if canEdit}
				<a href="/events/form?id={ data.event.id }">
					<Button variant="secondary">
						<Pencil size={ 15 } />
						Editar
					</Button>
				</a>
			{:else}
				<div title="El evento ya comenzó o finalizó. Solo un Super Administrador puede modificarlo.">
					<Button variant="secondary" disabled={ true } class="opacity-40 cursor-not-allowed">
						<Pencil size={ 15 } />
						Editar
					</Button>
				</div>
			{/if}
		</div>
	</div>

	{#if hasStarted && !data.isSuperAdmin}
		<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex items-center gap-2">
			<span>⚠️</span>
			<div>
				<p class="font-bold">Este evento ya comenzó o ha finalizado (Fecha: { formatDate( data.event.event_date ) }).</p>
				<p class="text-xs">Solo un Super Administrador puede modificar los datos y productos de este evento.</p>
			</div>
		</div>
	{/if}

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

	<!-- Event Products section -->
	<div class="card p-5 space-y-4">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<ShoppingBag size={ 18 } class="text-(--accent)" />
				<h2 class="text-base font-bold text-(--text-primary)">
					Productos del evento
				</h2>
			</div>

			<span class="text-xs px-2.5 py-0.5 rounded-full bg-(--accent)/10 text-(--accent) font-semibold border border-(--accent)/20">
				{ data.event.event_products?.length ?? 0 } { ( data.event.event_products?.length ?? 0 ) === 1 ? 'producto' : 'productos' }
			</span>
		</div>

		{#if !data.event.event_products || data.event.event_products.length === 0}
			<p class="text-xs text-(--text-muted) italic">No hay productos asociados a este evento.</p>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.event.event_products as ep}
					<div class="flex items-center justify-between p-3 rounded-xl bg-(--bg-base)/40 dark:bg-black/15 border border-(--border)/40">
						<div class="min-w-0 pr-2">
							<p class="text-sm font-semibold text-(--text-primary) truncate">
								{ ep.product?.name ?? 'Producto' }
							</p>
							<p class="text-[11px] text-(--text-secondary)">Cantidad por entrega</p>
						</div>

						<span class="px-3 py-1 rounded-lg bg-(--accent-muted) text-(--accent) font-extrabold text-sm shrink-0">
							x{ ep.quantity }
						</span>
					</div>
				{/each}
			</div>
		{/if}
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
					<Button variant="secondary" onclick={ () => { addModalOpen = true; addError = null; selectedFamilyIds = []; modalSearch = ''; } }>
						<Plus size={ 16 } />
						Asociar Familias
					</Button>
				{/if}
			</div>


			<div class="max-w-xs w-full">
				<SearchInput
					bind:value={ search }
					placeholder="Buscar familia o código..."
				/>
			</div>
		</div>

		{#if filteredFamilyEvents.length === 0}
			<div class="card p-12 flex flex-col items-center text-(--text-muted)">
				<Users size={ 48 } class="mb-3 opacity-30" />

				<p class="text-sm">
					{ search ? 'No se encontraron familias con ese nombre o código.' : 'No hay familias registradas para este evento.' }
				</p>
			</div>
		{:else}
			<div class="flex flex-wrap gap-6">
				{#each filteredFamilyEvents as fe}
					<TicketVerse
						familyEvent={ fe }
						order={ fe.orders?.[0] ?? null }
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
	onClose={ () => { addModalOpen = false; selectedFamilyIds = []; } }
	onConfirm={ confirmAdd }
	title="Asociar Familias al Evento"
	confirmLabel={ selectedFamilyIds.length > 1 ? `Asociar (${ selectedFamilyIds.length })` : 'Asociar' }
	loading={ isAdding }
	size="lg"
>
	<div class="space-y-4">
		<p class="text-sm text-(--text-muted)">
			Selecciona una o más familias para asociarlas a este evento y generar sus códigos QR. No se muestran familias que ya estén asociadas.
		</p>

		<!-- Buscador dentro del modal -->
		<SearchInput
			bind:value={ modalSearch }
			placeholder="Buscar familia por nombre o código..."
		/>

		<!-- Barra de herramientas de selección rápida -->
		<div class="flex items-center justify-between gap-2 text-xs pt-1">
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={ selectAllVisible }
					disabled={ modalFilteredFamilies.length === 0 }
					class="px-2.5 py-1 rounded-lg border border-border bg-bg-surface-2 hover:border-accent/40 text-text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Seleccionar todas ({ modalFilteredFamilies.length })
				</button>

				{#if selectedFamilyIds.length > 0}
					<button
						type="button"
						onclick={ clearAllSelection }
						class="px-2.5 py-1 rounded-lg border border-border bg-bg-surface-2 hover:border-accent/40 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
					>
						Deseleccionar todas
					</button>
				{/if}
			</div>

			<span class="text-text-secondary font-semibold">
				{ selectedFamilyIds.length } { selectedFamilyIds.length === 1 ? 'familia seleccionada' : 'familias seleccionadas' }
			</span>
		</div>

		<!-- Listado de familias disponibles sin paginador con scroll fluido -->
		<div class="max-h-72 overflow-y-auto border border-border rounded-xl divide-y divide-border/60 bg-bg-surface-2">
			{#each modalFilteredFamilies as family (family.id)}
				{@const isSelected = selectedFamilyIds.includes( family.id )}
				<button
					type="button"
					class="w-full text-left px-4 py-3 text-sm hover:bg-bg-surface transition-colors flex items-center justify-between cursor-pointer select-none { isSelected ? 'bg-accent/10 text-accent font-semibold' : 'text-text-primary' }"
					onclick={ () => toggleFamilySelection( family.id ) }
				>
					<div class="flex items-center gap-3 min-w-0">
						<BitsCheckbox.Root
							checked={ isSelected }
							onclick={ ( e ) => e.stopPropagation() }
							onCheckedChange={ () => toggleFamilySelection( family.id ) }
							class="w-5 h-5 min-w-5 min-h-5 rounded-md border flex items-center justify-center transition-all duration-200 cursor-pointer { isSelected ? 'bg-accent border-accent text-accent-text' : 'bg-bg-surface border-border hover:border-accent/40' }"
						>
							{#snippet children( { checked } )}
								{#if checked}
									<div class="text-accent-text">
										<Check size={ 13 } strokeWidth={ 3 } />
									</div>
								{/if}
							{/snippet}
						</BitsCheckbox.Root>

						<span class="truncate">{ family.family_name }</span>
					</div>

					{#if isSelected}
						<span class="text-[11px] font-bold uppercase tracking-wider text-accent shrink-0">Seleccionado</span>
					{:else if family.code}
						<span class="text-xs text-text-muted font-mono shrink-0">#{ family.code }</span>
					{/if}
				</button>
			{:else}
				<p class="p-6 text-center text-sm text-text-muted">
					{ modalSearch ? 'No se encontraron familias que coincidan con la búsqueda.' : 'No hay familias disponibles para asociar.' }
				</p>
			{/each}
		</div>

		{#if addError}
			<p class="text-red-500 text-sm font-medium">{ addError }</p>
		{/if}
	</div>
</Modal>
