<script lang="ts">
	import { createQuery }         from '@tanstack/svelte-query';
	import { page }                from '$app/stores';
	import { INTERNAL_ENDPOINT }   from '$lib/utils/endpoints.js';
	import TicketCard              from '$lib/components/tickets/TicketCard.svelte';
	import StatusBadge             from '$lib/components/ui/StatusBadge.svelte';
	import Button                  from '$lib/components/ui/Button.svelte';
	import type { EventConfig, FamilyEvent, Order } from '$lib/types/index.js';
	import { ArrowLeft, Pencil, CalendarDays, Users, Search } from '@lucide/svelte';

	const eventId = $derived( $page.params.id! );

	interface EventDetail extends EventConfig {
		family_events: Array<FamilyEvent & { orders: Order[] }>;
	}

	const eventQuery = createQuery<EventDetail>( () => ( {
		queryKey : [ 'events', eventId ],
		queryFn  : async () => {
			const res = await fetch( INTERNAL_ENDPOINT.events.detail( eventId ) );
			if ( !res.ok ) throw new Error( 'Error al cargar el evento' );
			return res.json();
		},
	} ) );

	let search = $state( '' );

	const filteredFamilyEvents = $derived(
		( eventQuery.data?.family_events ?? [] ).filter( ( fe ) =>
			!search.trim() || fe.family?.family_name?.toLowerCase().includes( search.toLowerCase() )
		)
	);

	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', { day: '2-digit', month: 'long', year: 'numeric' } );
	}

	const staffUrl = 'http://localhost:5174';
</script>

<svelte:head>
	<title>{eventQuery.data?.event_name ?? 'Evento'} — FamiPass Admin</title>
</svelte:head>

<div class="space-y-8">

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
		<div class="flex items-start gap-3">
			<a
				href="/events"
				class="mt-1 p-2 rounded-xl text-(--text-muted) hover:text-(--accent)
				       hover:bg-(--accent-muted) transition-all flex-shrink-0"
				aria-label="Volver"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				{#if eventQuery.isLoading}
					<div class="h-8 w-64 bg-(--bg-surface-2) rounded-lg animate-pulse mb-2"></div>
					<div class="h-4 w-40 bg-(--bg-surface-2) rounded animate-pulse"></div>
				{:else}
					<div class="flex items-center gap-3 flex-wrap">
						<h1 class="text-2xl font-bold text-(--text-primary)">{eventQuery.data?.event_name}</h1>
						{#if eventQuery.data?.status}
							<StatusBadge status={eventQuery.data.status} />
						{/if}
					</div>
					{#if eventQuery.data?.event_date}
						<p class="text-sm text-(--text-secondary) mt-1 flex items-center gap-1.5">
							<CalendarDays size={14} />
							{formatDate( eventQuery.data.event_date )}
						</p>
					{/if}
				{/if}
			</div>
		</div>

		<a href="/events/form?id={ eventId }">
			<Button variant="secondary">
				<Pencil size={15} />
				Editar
			</Button>
		</a>

	</div>

	<!-- Event meta -->
	{#if eventQuery.data && !eventQuery.isLoading}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			{#each [
				{ label: 'Lím. miembros',    value: eventQuery.data.max_family_members   ?? '—' },
				{ label: 'Lím. huéspedes',   value: eventQuery.data.max_guests_per_family ?? '—' },
				{ label: 'Detecta menores',  value: eventQuery.data.detect_by_minors ? 'Sí' : 'No' },
				{ label: 'Verif. huéspedes', value: eventQuery.data.require_guest_verification ? 'Sí' : 'No' },
			] as meta}
				<div class="card p-4">
					<p class="text-xs text-(--text-muted) mb-1">{meta.label}</p>
					<p class="font-semibold text-(--text-primary)">{meta.value}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Family tickets section -->
	<div>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
			<div class="flex items-center gap-2">
				<Users size={18} class="text-(--accent)" />
				<h2 class="text-lg font-semibold text-(--text-primary)">
					Tickets familiares
					{#if eventQuery.data?.family_events}
						<span class="text-sm font-normal text-(--text-muted) ml-1">
							({eventQuery.data.family_events.length})
						</span>
					{/if}
				</h2>
			</div>

			<div class="relative max-w-xs w-full">
				<Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />
				<input
					type="search"
					bind:value={search}
					placeholder="Buscar familia..."
					class="w-full pl-9 pr-4 py-2 rounded-xl border border-(--border)
					       bg-(--bg-surface-2) text-(--text-primary)
					       placeholder:text-(--text-muted) text-sm
					       focus:outline-none focus:border-(--border-focus) focus:ring-2 focus:ring-(--accent)/20
					       transition-all"
				/>
			</div>
		</div>

		{#if eventQuery.isLoading}
			<div class="flex gap-4 flex-wrap">
				{#each [ 1, 2, 3 ] as _}
					<div class="w-80 h-96 rounded-2xl bg-(--bg-surface-2) animate-pulse"></div>
				{/each}
			</div>
		{:else if filteredFamilyEvents.length === 0}
			<div class="card p-12 flex flex-col items-center text-(--text-muted)">
				<Users size={48} class="mb-3 opacity-30" />
				<p class="text-sm">
					{search ? 'No se encontraron familias con ese nombre.' : 'No hay familias registradas para este evento.'}
				</p>
			</div>
		{:else}
			<div class="flex flex-wrap gap-6">
				{#each filteredFamilyEvents as fe}
					<TicketCard
						familyEvent={fe}
						order={fe.orders?.[0] ?? null}
						{staffUrl}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
