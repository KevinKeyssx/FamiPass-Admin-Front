<script lang="ts">
	import { ArrowLeft, Pencil, CalendarDays, Users, Search } from '@lucide/svelte';

	import type {
		EventConfig,
		FamilyEvent,
		Order
	}                   from '$lib/types/index.js';
	import TicketCard   from '$lib/components/tickets/TicketCard.svelte';
	import StatusBadge  from '$lib/components/ui/StatusBadge.svelte';
	import Button       from '$lib/components/ui/Button.svelte';


	interface EventDetail extends EventConfig {
		family_events: Array<FamilyEvent & { orders: Order[] }>;
	}


	interface Props {
		data: {
			event : EventDetail;
		};
	}


	let { data }: Props = $props();
	let search          = $state( '' );


	const filteredFamilyEvents = $derived(
		( data.event.family_events ?? [] ).filter( ( fe ) =>
			!search.trim() || fe.family?.family_name?.toLowerCase().includes( search.toLowerCase() )
		)
	);


	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', { day: '2-digit', month: 'long', year: 'numeric' } );
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
			<div class="flex items-center gap-2">
				<Users size={ 18 } class="text-(--accent)" />

				<h2 class="text-lg font-semibold text-(--text-primary)">
					Tickets familiares

					<span class="text-sm font-normal text-(--text-muted) ml-1">
						({ data.event.family_events?.length ?? 0 })
					</span>
				</h2>
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
					<TicketCard
						familyEvent={ fe }
						order={ fe.orders?.[0] ?? null }
						{ staffUrl }
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
