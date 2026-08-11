<script lang="ts">
	import { Shield, Trash2, Edit2 } from '@lucide/svelte';

	import {
		getRoleBadgeStyles,
		getRoleLabel
	}                       from '../utils/constants';
	import type { User }    from '$lib/types/index.js';


	interface Props {
		users    : User[];
		onDelete : ( user: User ) => void;
	}


	let {
		users,
		onDelete
	}: Props = $props();
</script>

<div class="card overflow-hidden">
	{#if users.length === 0}
		<div class="flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
			<Shield size={ 48 } class="mb-4 opacity-20" />
			<p class="text-sm font-medium">No se encontraron usuarios registrados.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bg-surface-2 select-none">
						<th class="text-left px-6 py-4 font-semibold text-text-secondary">Nombre / Usuario</th>
						<th class="text-left px-6 py-4 font-semibold text-text-secondary hidden sm:table-cell">Email</th>
						<th class="text-left px-6 py-4 font-semibold text-text-secondary hidden md:table-cell">Teléfono</th>
						<th class="text-left px-6 py-4 font-semibold text-text-secondary">Rol</th>
						<th class="text-right px-6 py-4 font-semibold text-text-secondary">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each users as user}
						<tr class="hover:bg-bg-surface-2/40 transition-colors">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-xl bg-accent-muted text-accent flex items-center justify-center font-bold text-sm select-none shadow-xs">
										{ user.full_name.charAt( 0 ).toUpperCase() }
									</div>
									<div class="truncate">
										<div class="flex items-center gap-1.5">
											<p class="font-semibold text-text-primary truncate max-w-48" title={ user.full_name }>
												{ user.full_name }
											</p>

											{#if !user.is_active}
												<span class="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 leading-none select-none">
													Inactivo
												</span>
											{/if}
										</div>
										{#if user.user_name}
											<p class="text-xs text-text-secondary mt-0.5">@{ user.user_name }</p>
										{/if}
									</div>
								</div>
							</td>

							<td class="px-6 py-4 text-text-secondary hidden sm:table-cell whitespace-nowrap">
								{ user.email || '—' }
							</td>

							<td class="px-6 py-4 text-text-secondary hidden md:table-cell whitespace-nowrap">
								{ user.phone || '—' }
							</td>

							<td class="px-6 py-4">
								<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide whitespace-nowrap { getRoleBadgeStyles( user.role ) }">
									{ getRoleLabel( user.role ) }
								</span>
							</td>

							<td class="px-6 py-4">
								<div class="flex items-center justify-end gap-1.5">
									<a href="/users/form?id={ user.id }">
										<button
											class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300 cursor-pointer"
											title="Editar usuario"
										>
											<Edit2 size={ 15 } />
										</button>
									</a>

									<button
										onclick={ () => onDelete( user ) }
										class="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
										title="Eliminar usuario"
									>
										<Trash2 size={ 15 } />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
