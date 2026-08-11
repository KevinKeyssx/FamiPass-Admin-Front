<script lang="ts">
	import { CalendarDays, Clock, Users, UserPlus } from '@lucide/svelte';

	import type { EventConfig } from '$lib/types/index.js';
	import Preview              from '$lib/components/shared/Preview.svelte';
	import Status               from './Status.svelte';
	import Actions              from '$lib/components/shared/Actions.svelte';


	interface Props {
		events   : EventConfig[];
		onDelete : ( event: EventConfig ) => void;
	}


	let {
		events,
		onDelete
	}: Props = $props();


    function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day   : '2-digit',
			month : 'short',
			year  : 'numeric'
		});
	}
</script>

{#if events.length === 0 }
	<div class="card flex flex-col items-center py-16 text-(--text-muted)">
		<CalendarDays size={ 48 } class="mb-3 opacity-30" />

		<p class="text-sm">No hay eventos con este filtro.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
		{#each events as event}
			<div class="card p-5 flex flex-col justify-between gap-3 bg-linear-to-b from-(--bg-surface) to-(--bg-surface-2) border border-(--border)/60 scale-100 hover:border-(--accent) hover:scale-[1.01] hover:shadow-md hover:shadow-(--accent)/8 !transition-all duration-500 ease-out rounded-2xl relative overflow-hidden group">
				<!-- Header -->
				<div class="space-y-2 relative z-10">
					<div class="flex items-start justify-between gap-3">
						<h3 class="font-bold text-base text-(--text-primary) line-clamp-2" title={ event.event_name }>
							{ event.event_name }
						</h3>

						<div class="shrink-0">
							<Status status={ event.status } />
						</div>
					</div>

					<!-- Badges -->
					<div class="flex flex-wrap gap-2 mt-1">
						{#if event.detect_by_minors }
							<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 tracking-wide">
								Detecta Menores
							</span>
						{/if}

						{#if event.require_guest_verification }
							<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-(--accent-muted) text-(--accent) border border-(--accent)/20 tracking-wide">
								Verificación Req.
							</span>
						{/if}
					</div>
				</div>

				<!-- Content / Info Grid -->
				<div class="grid grid-cols-2 gap-2.5 my-1 text-xs relative z-10">
					<!-- Fecha -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						<div class="p-2 rounded-lg bg-(--accent-muted) text-(--accent) shrink-0 transition-transform group-hover/item:scale-110">
							<CalendarDays size={ 14 } />
						</div>

						<div class="truncate">
							<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Fecha</p>

							<p class="font-semibold text-(--text-primary) mt-1 leading-none">{ formatDate( event.event_date ) }</p>
						</div>
					</div>

					<!-- Deadline -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						<div class="p-2 rounded-lg bg-orange-500/10 text-orange-500 dark:text-orange-400 shrink-0 transition-transform group-hover/item:scale-110">
							<Clock size={ 14 } />
						</div>

						<div class="truncate">
							<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Deadline</p>

							<p class="font-semibold text-(--text-primary) mt-1 leading-none">{ formatDate( event.registration_deadline ) }</p>
						</div>
					</div>

					<!-- Miembros -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						<div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shrink-0 transition-transform group-hover/item:scale-110">
							<Users size={ 14 } />
						</div>

						<div>
							<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Miembros</p>
							<p class="font-semibold text-(--text-primary) mt-1 leading-none">{ event.max_family_members ?? '—' }</p>
						</div>
					</div>

					<!-- Invitados -->
					<div class="bg-(--bg-base)/40 dark:bg-black/10 border border-(--border)/30 p-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-(--bg-base)/60 dark:hover:bg-black/20 group/item">
						<div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shrink-0 transition-transform group-hover/item:scale-110">
							<UserPlus size={ 14 } />
						</div>

						<div>
							<p class="text-[9px] text-(--text-secondary) font-bold uppercase tracking-wider leading-none">Invitados</p>

							<p class="font-semibold text-(--text-primary) mt-1 leading-none">{ event.max_guests_per_family ?? '—' }</p>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-between border-t border-(--border)/40 pt-3 mt-0 relative z-10">
					<span class="text-[11px] text-(--text-secondary) flex items-center gap-1.5">
						<Clock size={14} />

						Creado: { event.created_at ? new Date( event.created_at ).toLocaleDateString( 'es-CL', {
							day   : '2-digit',
							month : '2-digit',
							year  : 'numeric'
						}) : '—' }
					</span>

					<div class="flex items-center gap-1.5">
						<Preview href={ `/events/${ event.id }` } />

						<Actions
							editHref    = "/events/form?id={ event.id }"
							canDelete   = { event.status === 'DRAFT' }
							onDelete    = {() => { onDelete( event ); }}
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
