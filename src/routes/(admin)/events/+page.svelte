<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { INTERNAL_ENDPOINT }  from '$lib/utils/endpoints.js';
	import StatusBadge            from '$lib/components/ui/StatusBadge.svelte';
	import Button                 from '$lib/components/ui/Button.svelte';
	import Modal                  from '$lib/components/ui/Modal.svelte';
	import type { EventConfig, EventStatus } from '$lib/types/index.js';
	import { CalendarPlus, CalendarDays, Filter, Pencil, Trash2, Eye } from '@lucide/svelte';

	const qc = useQueryClient();

	const eventsQuery = createQuery<EventConfig[]>( () => ( {
		queryKey : [ 'events' ],
		queryFn  : async () => {
			const res = await fetch( INTERNAL_ENDPOINT.events.list );
			if ( !res.ok ) throw new Error( 'Error al cargar eventos' );
			return res.json();
		},
	} ) );

	const deleteMutation = createMutation( () => ( {
		mutationFn: async ( id: string ) => {
			const res = await fetch( INTERNAL_ENDPOINT.events.delete( id ), { method: 'DELETE' } );
			if ( !res.ok ) {
				const body = await res.json();
				throw new Error( body.error ?? 'Error al eliminar evento' );
			}
		},
		onSuccess: () => {
			qc.invalidateQueries( { queryKey: [ 'events' ] } );
			deleteModal = { open: false, id: null, name: '' };
		},
		onError: ( err: Error ) => {
			deleteError = err.message;
		},
	} ) );

	let filterStatus = $state<EventStatus | 'ALL'>( 'ALL' );
	let deleteModal  = $state<{ open: boolean; id: string | null; name: string }>( { open: false, id: null, name: '' } );
	let deleteError  = $state<string | null>( null );

	const filtered = $derived(
		filterStatus === 'ALL'
			? ( eventsQuery.data ?? [] )
			: ( eventsQuery.data ?? [] ).filter( ( e ) => e.status === filterStatus )
	);

	const statusOptions: Array<{ value: EventStatus | 'ALL'; label: string }> = [
		{ value: 'ALL',         label: 'Todos' },
		{ value: 'DRAFT',       label: 'Borrador' },
		{ value: 'IN_PROGRESS', label: 'En Curso' },
		{ value: 'FINISHED',    label: 'Finalizado' },
		{ value: 'CANCELLED',   label: 'Cancelado' },
	];

	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', { day: '2-digit', month: 'short', year: 'numeric' } );
	}

	function openDeleteModal( event: EventConfig ): void {
		deleteError = null;
		deleteModal = { open: true, id: event.id, name: event.event_name };
	}

	function confirmDelete(): void {
		if ( deleteModal.id ) deleteMutation.mutate( deleteModal.id );
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
		<a href="/events/new">
			<Button variant="primary">
				<CalendarPlus size={16} />
				Nuevo Evento
			</Button>
		</a>
	</div>

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap items-center gap-3">
		<Filter size={16} class="text-(--text-muted) shrink-0" />
		<span class="text-sm text-(--text-secondary) font-medium">Filtrar:</span>
		{#each statusOptions as opt}
			<button
				onclick={() => { filterStatus = opt.value; }}
				class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
				       {filterStatus === opt.value
				           ? 'bg-(--accent) text-(--accent-text) shadow-sm'
				           : 'bg-(--bg-surface-2) text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted)'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>

	<!-- Table -->
	<div class="card overflow-hidden">
		{#if eventsQuery.isLoading}
			<div class="p-8 space-y-4">
				{#each [ 1, 2, 3, 4 ] as _}
					<div class="h-12 rounded-xl bg-(--bg-surface-2) animate-pulse"></div>
				{/each}
			</div>
		{:else if eventsQuery.isError}
			<div class="p-8 text-center text-red-500">
				Error al cargar los eventos. Intenta recargar la página.
			</div>
		{:else if filtered.length === 0}
			<div class="flex flex-col items-center py-16 text-(--text-muted)">
				<CalendarDays size={48} class="mb-3 opacity-30" />
				<p class="text-sm">No hay eventos con este filtro.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-(--border) bg-(--bg-surface-2)">
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary)">Nombre</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden sm:table-cell">Fecha</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden md:table-cell">Deadline</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden lg:table-cell">Lím. Miembros</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden lg:table-cell">Lím. Huéspedes</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden xl:table-cell">Verif. Requerida</th>
							<th class="text-left px-4 py-3 font-semibold text-(--text-secondary)">Estado</th>
							<th class="text-right px-4 py-3 font-semibold text-(--text-secondary)">Acciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-(--border)">
						{#each filtered as event}
							<tr class="hover:bg-(--bg-surface-2) transition-colors">
								<td class="px-4 py-3">
									<p class="font-medium text-(--text-primary) truncate max-w-45">{event.event_name}</p>
									{#if event.detect_by_minors}
										<span class="text-xs text-(--text-muted)">Detecta menores</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-(--text-secondary) hidden sm:table-cell whitespace-nowrap">
									{formatDate( event.event_date )}
								</td>
								<td class="px-4 py-3 text-(--text-secondary) hidden md:table-cell whitespace-nowrap">
									{formatDate( event.registration_deadline )}
								</td>
								<td class="px-4 py-3 text-(--text-secondary) hidden lg:table-cell text-center">
									{event.max_family_members ?? '—'}
								</td>
								<td class="px-4 py-3 text-(--text-secondary) hidden lg:table-cell text-center">
									{event.max_guests_per_family ?? '—'}
								</td>
								<td class="px-4 py-3 hidden xl:table-cell text-center">
									{#if event.require_guest_verification}
										<span class="text-(--accent)">✓</span>
									{:else}
										<span class="text-(--text-muted)">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<StatusBadge status={event.status} />
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-end gap-1">
										<a
											href="/events/{event.id}"
											class="p-2 rounded-lg text-(--text-muted) hover:text-(--accent)
											       hover:bg-(--accent-muted) transition-all"
											aria-label="Ver evento"
										>
											<Eye size={16} />
										</a>
										<a
											href="/events/form?id={ event.id }"
											class="p-2 rounded-lg text-(--text-muted) hover:text-(--accent)
											       hover:bg-(--accent-muted) transition-all"
											aria-label="Editar evento"
										>

											<Pencil size={16} />
										</a>
										{#if event.status === 'DRAFT'}
											<button
												onclick={() => openDeleteModal( event )}
												class="p-2 rounded-lg text-(--text-muted) hover:text-red-500
												       hover:bg-red-500/10 transition-all"
												aria-label="Eliminar evento"
											>
												<Trash2 size={16} />
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Delete modal -->
<Modal
	open={deleteModal.open}
	title="Eliminar evento"
	onClose={() => { deleteModal = { open: false, id: null, name: '' }; deleteError = null; }}
	onConfirm={confirmDelete}
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={deleteMutation.isPending}
>
	<p>¿Estás seguro de que deseas eliminar el evento <strong class="text-(--text-primary)">"{deleteModal.name}"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{deleteError}</p>
	{/if}
</Modal>

