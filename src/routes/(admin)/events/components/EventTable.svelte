<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';

	import Actions                             from '$lib/components/shared/Actions.svelte';
	import type { EventConfig }                from '$lib/types/index.js';
	import { isEventExpired, hasEventStarted } from '$lib/utils/date.js';
	import Preview                             from '$lib/components/shared/Preview.svelte';
	import Status                              from './Status.svelte';


	interface Props {
		events        : EventConfig[];
		isSuperAdmin? : boolean;
		onDelete      : ( event: EventConfig ) => void;
	}


	let {
		events,
		isSuperAdmin = false,
		onDelete
	}: Props = $props();



	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day   : '2-digit',
			month : 'short',
			year  : 'numeric'
		} );
	}
</script>

<div class="card overflow-hidden">
	{#if events.length === 0 }
		<div class="flex flex-col items-center py-16 text-(--text-muted)">
			<CalendarDays size={ 48 } class="mb-3 opacity-30" />
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
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden md:table-cell">Límite Canje</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden lg:table-cell">Lím. Miembros</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden lg:table-cell">Lím. Invitados</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary) hidden xl:table-cell">Verif. Requerida</th>
						<th class="text-left px-4 py-3 font-semibold text-(--text-secondary)">Estado</th>
						<th class="text-right px-4 py-3 font-semibold text-(--text-secondary)">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-(--border)">
					{#each events as event}
						<tr class="hover:bg-(--bg-surface-2) transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<p class="font-medium text-(--text-primary) truncate max-w-45">{ event.event_name }</p>
									{#if event.expires_at && isEventExpired( event.expires_at )}
										<span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
											EXPIRADO
										</span>
									{/if}
								</div>

								{#if event.detect_by_minors }
									<span class="text-xs text-(--text-muted)">Detecta menores</span>
								{/if}
							</td>

							<td class="px-4 py-3 text-(--text-secondary) hidden sm:table-cell whitespace-nowrap">
								{ formatDate( event.event_date ) }
							</td>

							<td class="px-4 py-3 text-(--text-secondary) hidden md:table-cell whitespace-nowrap">
								{ formatDate( event.registration_deadline ) }
							</td>

							<td class="px-4 py-3 text-(--text-secondary) hidden md:table-cell whitespace-nowrap">
								{#if event.expires_at}
									<span class={ isEventExpired( event.expires_at ) ? 'text-red-500 font-semibold' : '' }>
										{ formatDate( event.expires_at ) }
									</span>
								{:else}
									<span class="text-(--text-muted)">—</span>
								{/if}
							</td>


							<td class="px-4 py-3 text-(--text-secondary) hidden lg:table-cell text-center">
								{ event.max_family_members ?? '—' }
							</td>

							<td class="px-4 py-3 text-(--text-secondary) hidden lg:table-cell text-center">
								{ event.max_guests_per_family ?? '—' }
							</td>

							<td class="px-4 py-3 hidden xl:table-cell text-center">
								{#if event.require_guest_verification }
									<span class="text-(--accent)">✓</span>
								{:else}
									<span class="text-(--text-muted)">—</span>
								{/if}
							</td>

							<td class="px-4 py-3">
								<Status status={ event.status } />
							</td>

							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									<Preview href={ `/events/${ event.id }` } />

									<Actions
										editHref            = "/events/form?id={ event.id }"
										canDelete           = { event.status === 'DRAFT' }
										canEdit             = { isSuperAdmin || !hasEventStarted( event.event_date ) }
										disabledEditTooltip = "El evento ya comenzó o finalizó. Solo Super Admin puede modificarlo."
										onDelete            = { () => { onDelete( event ); } }
									/>

								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
