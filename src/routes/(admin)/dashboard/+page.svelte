<script lang="ts">
	import {
		CalendarDays,
		TrendingUp,
		ArrowRight,
		CircleCheckBig,
		Users,
		User,
		QrCode,
		Plus,
		Clock,
		Sparkles
	} from '@lucide/svelte';

	import StatusBadge          from '$lib/components/ui/StatusBadge.svelte';
	import type { EventConfig } from '$lib/types/index.js';
	import type { Order }       from '$lib/types/order.js';


	interface Props {
		data: {
			events          : EventConfig[];
			totalFamilies   : number;
			totalMembers    : number;
			totalOrders     : number;
			deliveredOrders : number;
			recentOrders    : Order[];
		};
	}


	let { data }: Props = $props();


	const activeEvents = $derived(
		data.events.filter( ( e ) => e.status === 'IN_PROGRESS' ).length
	);


	const recentEvents = $derived(
		[ ...data.events ]
			.sort( ( a, b ) => new Date( b.created_at ?? 0 ).getTime() - new Date( a.created_at ?? 0 ).getTime() )
			.slice( 0, 5 )
	);


	const deliveredPercentage = $derived(
		data.totalOrders > 0
			? ( data.deliveredOrders / data.totalOrders ) * 100
			: 0
	);


	function formatDate( dateStr: string ): string {
		return new Date( dateStr ).toLocaleDateString( 'es-CL', {
			day   : 'numeric',
			month : 'long',
			year  : 'numeric'
		});
	}


	function formatTime( dateStr: string ): string {
		return new Date( dateStr ).toLocaleDateString( 'es-CL', {
			day    : 'numeric',
			month  : 'short',
			hour   : '2-digit',
			minute : '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dashboard — FamiPass Admin</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header: Bienvenida e info general -->
	<div class="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
		<div class="absolute inset-0 bg-radial from-accent/5 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>

		<div class="space-y-2 relative z-10">
			<div class="flex items-center gap-2 text-accent font-semibold text-sm">
				<Sparkles size={ 16 } class="animate-pulse" />
				<span>Panel de Control</span>
			</div>
			<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
				¡Bienvenido de vuelta!
			</h1>
			<p class="text-sm text-(--text-secondary) max-w-md">
				Aquí tienes el resumen de actividades, eventos activos y la tasa de entrega de beneficios de hoy.
			</p>
		</div>

		<div class="flex gap-3 relative z-10 shrink-0">
			<a
				href="/events/form"
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent text-accent-text hover:opacity-90 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 transition-all duration-300"
			>
				<Plus size={ 16 } />
				Nuevo Evento
			</a>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Eventos Activos -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/40 border border-border/60 hover:border-accent/30 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
			<div class="flex items-start justify-between">
				<div class="space-y-2">
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Eventos en curso</p>
					<p class="text-3xl font-extrabold text-(--text-primary)">{ activeEvents }</p>
					<p class="text-xs text-accent font-medium">De { data.events.length } eventos totales</p>
				</div>
				<div class="p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
					<TrendingUp size={ 22 } />
				</div>
			</div>
		</div>

		<!-- Total Familias -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/40 border border-border/60 hover:border-accent/30 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
			<div class="flex items-start justify-between">
				<div class="space-y-2">
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Total Familias</p>
					<p class="text-3xl font-extrabold text-(--text-primary)">{ data.totalFamilies }</p>
					<a href="/families" class="text-xs text-accent hover:underline font-medium">Gestionar núcleos familiares →</a>
				</div>
				<div class="p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
					<Users size={ 22 } />
				</div>
			</div>
		</div>

		<!-- Miembros Registrados -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/40 border border-border/60 hover:border-accent/30 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
			<div class="flex items-start justify-between">
				<div class="space-y-2">
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Miembros Beneficiarios</p>
					<p class="text-3xl font-extrabold text-(--text-primary)">{ data.totalMembers }</p>
					<p class="text-xs text-(--text-muted) font-medium">Personas asociadas a familias</p>
				</div>
				<div class="p-3 rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform duration-300">
					<User size={ 22 } />
				</div>
			</div>
		</div>

		<!-- Entrega de Beneficios -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/40 border border-border/60 hover:border-accent/30 hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
			<div class="flex items-start justify-between">
				<div class="space-y-2 w-full">
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">Tasa de Canje</p>
					<div class="flex items-baseline gap-2">
						<p class="text-3xl font-extrabold text-(--text-primary)">{ deliveredPercentage.toFixed( 1 ) }%</p>
						<span class="text-xs text-(--text-muted)">({ data.deliveredOrders }/{ data.totalOrders })</span>
					</div>
					<div class="w-full h-1.5 bg-bg-surface-2 rounded-full overflow-hidden mt-2 relative">
						<div class="h-full bg-accent rounded-full transition-all duration-500" style="width: { deliveredPercentage }%"></div>
					</div>
				</div>
				<div class="p-3 rounded-xl bg-accent/10 text-accent shrink-0 group-hover:scale-110 transition-transform duration-300">
					<CircleCheckBig size={ 22 } />
				</div>
			</div>
		</div>
	</div>

	<!-- Split Layout: Eventos & Actividades -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Eventos Recientes -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/20 border border-border/60 rounded-2xl space-y-5">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-(--text-primary) flex items-center gap-2">
					<CalendarDays size={ 18 } class="text-accent" />
					<span>Eventos recientes</span>
				</h2>

				<a
					href="/events"
					class="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
				>
					Ver todos <ArrowRight size={ 12 } />
				</a>
			</div>

			{#if recentEvents.length === 0}
				<div class="flex flex-col items-center py-14 text-(--text-muted) border border-dashed border-border rounded-xl">
					<CalendarDays size={ 36 } class="mb-3 opacity-40 text-accent" />
					<p class="text-sm font-medium">No hay eventos registrados aún.</p>
					<a href="/events/form" class="mt-3 text-xs text-accent font-semibold hover:underline bg-accent/5 px-3 py-1.5 rounded-lg">
						Crear primer evento →
					</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each recentEvents as event}
						<a
							href="/events/{ event.id }"
							class="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-bg-surface hover:border-accent/40 hover:shadow-xs transition-all duration-300 group"
						>
							<div class="flex items-center gap-3.5 min-w-0">
								<div class="w-10 h-10 rounded-xl bg-bg-surface-2 border border-border flex items-center justify-center shrink-0">
									<CalendarDays size={ 16 } class="text-text-muted group-hover:text-accent transition-colors" />
								</div>

								<div class="min-w-0 space-y-0.5">
									<p class="text-sm font-bold text-(--text-primary) truncate">{ event.event_name }</p>
									<p class="text-xs text-(--text-muted)">{ formatDate( event.event_date ) }</p>
								</div>
							</div>

							<div class="flex items-center gap-3 shrink-0 ml-4">
								<StatusBadge status={ event.status } />
								<div class="p-1 rounded-lg text-(--text-muted) group-hover:text-accent group-hover:bg-accent/10 transition-all duration-300">
									<ArrowRight size={ 14 } />
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Actividad Reciente / Entregas -->
		<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/20 border border-border/60 rounded-2xl space-y-5">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-(--text-primary) flex items-center gap-2">
					<Clock size={ 18 } class="text-accent" />
					<span>Últimos canjes</span>
				</h2>
			</div>

			{#if data.recentOrders.length === 0}
				<div class="flex flex-col items-center py-14 text-(--text-muted) border border-dashed border-border rounded-xl">
					<Clock size={ 36 } class="mb-3 opacity-40 text-accent" />
					<p class="text-sm font-medium">No se han registrado entregas hoy.</p>
					<p class="text-xs text-(--text-muted) mt-1">Usa la app de escaneo para canjear beneficios.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentOrders as order}
						<div class="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-bg-surface hover:border-accent/20 transition-all duration-300">
							<div class="flex items-center gap-3.5 min-w-0">
								<div class="w-10 h-10 rounded-xl bg-bg-surface-2 border border-border flex items-center justify-center shrink-0">
									<QrCode size={ 16 } class="text-accent" />
								</div>

								<div class="min-w-0 space-y-0.5">
									<div class="flex items-center gap-1.5">
										<p class="text-sm font-bold text-(--text-primary) truncate">
											{ order.family_event?.family?.family_name ?? 'Familia' }
										</p>
									</div>
									<p class="text-xs text-(--text-muted) truncate">
										Evento: { order.family_event?.event?.event_name ?? '—' }
									</p>
								</div>
							</div>

							<div class="flex flex-col items-end gap-1.5 shrink-0 ml-4">
								<span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-green-500/10 text-green-500">
									Entregado
								</span>
								<p class="text-[10px] text-(--text-muted) font-mono">{ formatTime( order.created_at ) }</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Accesos Rápidos de Administración -->
	<div class="card p-6 bg-linear-to-b from-bg-surface to-bg-surface-2/20 border border-border/60 rounded-2xl space-y-4">
		<h2 class="text-lg font-bold text-(--text-primary)">Accesos Rápidos de Gestión</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<a
				href="/events/form"
				class="p-4 rounded-xl border border-border/50 hover:border-accent/30 bg-bg-surface hover:bg-accent/5 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col gap-2"
			>
				<CalendarDays size={ 20 } class="text-accent group-hover:scale-110 transition-transform duration-300" />
				<h3 class="font-bold text-sm text-(--text-primary)">Crear Evento</h3>
				<p class="text-xs text-(--text-muted)">Configura fechas y plazos para nuevas actividades.</p>
			</a>

			<a
				href="/families"
				class="p-4 rounded-xl border border-border/50 hover:border-accent/30 bg-bg-surface hover:bg-accent/5 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col gap-2"
			>
				<Users size={ 20 } class="text-accent group-hover:scale-110 transition-transform duration-300" />
				<h3 class="font-bold text-sm text-(--text-primary)">Registrar Familia</h3>
				<p class="text-xs text-(--text-muted)">Inscribe nuevos grupos familiares y miembros beneficiarios.</p>
			</a>

			<a
				href="/events"
				class="p-4 rounded-xl border border-border/50 hover:border-accent/30 bg-bg-surface hover:bg-accent/5 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col gap-2"
			>
				<QrCode size={ 20 } class="text-accent group-hover:scale-110 transition-transform duration-300" />
				<h3 class="font-bold text-sm text-(--text-primary)">Canje de Beneficios</h3>
				<p class="text-xs text-(--text-muted)">Administra e inicia el escaneo de códigos QR por evento.</p>
			</a>
		</div>
	</div>
</div>
