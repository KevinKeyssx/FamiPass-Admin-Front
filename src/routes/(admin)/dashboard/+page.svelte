<script lang="ts">
	import { CalendarDays, TrendingUp, ArrowRight, CircleCheckBig } from '@lucide/svelte';

    import StatusBadge          from '$lib/components/ui/StatusBadge.svelte';
	import type { EventConfig } from '$lib/types/index.js';
	import { eventsStore }      from '$lib/stores/events.svelte.js';

	interface Props {
		data: {
			events: EventConfig[];
		};
	}

	let { data }: Props = $props();

	$effect( () => {
		if ( !eventsStore.isInitialized ) {
			eventsStore.set( data.events );
		}
	} );

	const activeEvents = $derived(
		eventsStore.list.filter( ( e ) => e.status === 'IN_PROGRESS' ).length
	);

	const recentEvents = $derived(
		[ ...eventsStore.list ]
			.sort( ( a, b ) => new Date( b.created_at ?? 0 ).getTime() - new Date( a.created_at ?? 0 ).getTime() )
			.slice( 0, 5 )
	);

	function formatDate( dateStr: string ): string {
		return new Date( dateStr ).toLocaleDateString( 'es-CL', {
			day  : 'numeric',
			month: 'long',
			year : 'numeric',
		} );
	}
</script>

<svelte:head>
	<title>Dashboard — FamiPass Admin</title>
</svelte:head>

<div class="space-y-8">

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-(--text-primary)">Dashboard</h1>
		<p class="text-(--text-secondary) mt-1">Resumen general de FamiPass</p>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

		<div class="card p-6 hover:shadow-(--shadow-lg) hover:-translate-y-0.5">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-(--text-secondary)">Eventos activos</p>
					<p class="text-3xl font-bold text-(--text-primary) mt-1">{activeEvents}</p>
				</div>
				<div class="p-3 rounded-xl bg-(--accent-muted) text-(--accent)">
					<TrendingUp size={22} />
				</div>
			</div>
		</div>

		<div class="card p-6 hover:shadow-(--shadow-lg) hover:-translate-y-0.5">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-(--text-secondary)">Total de eventos</p>

                    <p class="text-3xl font-bold text-(--text-primary) mt-1">
						{ eventsStore.list.length }
					</p>
				</div>

                <div class="p-3 rounded-xl bg-(--accent-muted) text-(--accent)">
					<CalendarDays size={22} />
				</div>
			</div>
		</div>

		<div class="card p-6 hover:shadow-(--shadow-lg) hover:-translate-y-0.5">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm font-medium text-(--text-secondary)">Finalizados</p>

                    <p class="text-3xl font-bold text-(--text-primary) mt-1">
						{ eventsStore.list.filter( ( e ) => e.status === 'FINISHED' ).length }
					</p>
				</div>

                <div class="p-3 rounded-xl bg-(--accent-muted) text-(--accent)">
                    <CircleCheckBig size={22} />
				</div>
			</div>
		</div>

	</div>

	<!-- Eventos Recientes -->
	<div class="card p-6">
		<div class="flex items-center justify-between mb-5">
			<h2 class="text-lg font-semibold text-(--text-primary)">Eventos recientes</h2>

            <a
				href="/events"
				class="flex items-center gap-1 text-sm font-medium text-(--accent) hover:underline"
			>
				Ver todos <ArrowRight size={14} />
			</a>
		</div>

		{#if recentEvents.length === 0}
			<div class="flex flex-col items-center py-10 text-(--text-muted)">
				<CalendarDays size={40} class="mb-3 opacity-40" />

                <p class="text-sm">No hay eventos registrados aún.</p>

                <a href="/events/form" class="mt-3 text-sm text-(--accent) hover:underline">
					Crear el primer evento →
				</a>
			</div>
		{:else}
			<div class="space-y-2">
				{#each recentEvents as event}
					<a
						href="/events/{event.id}"
						class="flex items-center justify-between p-3 rounded-xl
                            hover:bg-(--bg-surface-2) transition-colors group"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div class="w-2 h-2 rounded-full shrink-0 bg-(--accent)"></div>

                            <div class="min-w-0">
								<p class="text-sm font-medium text-(--text-primary) truncate">{event.event_name}</p>

                                <p class="text-xs text-(--text-muted)">{formatDate( event.event_date )}</p>
							</div>
						</div>

                        <div class="flex items-center gap-3 shrink-0 ml-4">
							<StatusBadge status={event.status} />

                            <ArrowRight size={14} class="text-(--text-muted) group-hover:text-(--accent) transition-colors" />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
