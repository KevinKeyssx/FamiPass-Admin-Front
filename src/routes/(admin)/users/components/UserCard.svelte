<script lang="ts">
	import { Shield, Trash2, Edit2, Phone, Mail } from '@lucide/svelte';

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

{#if users.length === 0}
	<div class="card flex flex-col items-center py-20 text-text-muted bg-linear-to-b from-bg-surface to-bg-surface-2">
		<Shield size={ 48 } class="mb-4 opacity-20" />
		<p class="text-sm font-medium">No se encontraron usuarios registrados.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
		{#each users as user}
			<div class="card p-5 flex flex-col justify-between gap-4 bg-linear-to-b from-bg-surface to-bg-surface-2 border border-border/60 scale-100 hover:border-accent hover:scale-[1.01] hover:shadow-md hover:shadow-accent/8 !transition-all duration-500 ease-out rounded-2xl relative overflow-hidden group">
				<!-- Header -->
				<div class="space-y-2 relative z-10">
					<div class="flex items-start justify-between gap-3">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl bg-accent-muted text-accent flex items-center justify-center font-bold text-base select-none shadow-xs shrink-0">
								{ user.full_name.charAt( 0 ).toUpperCase() }
							</div>
							<div class="truncate">
								<h3 class="font-bold text-base text-text-primary truncate max-w-44" title={ user.full_name }>
									{ user.full_name }
								</h3>
								{#if user.user_name}
									<p class="text-xs text-text-secondary mt-0.5">@{ user.user_name }</p>
								{/if}
							</div>
						</div>

						<div class="shrink-0 flex flex-col gap-1.5 items-end">
							<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide whitespace-nowrap { getRoleBadgeStyles( user.role ) }">
								{ getRoleLabel( user.role ) }
							</span>

							{#if !user.is_active}
								<span class="px-2 py-0.5 rounded-sm text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 leading-none select-none tracking-wide">
									Inactivo
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Contact Details -->
				<div class="space-y-2 text-xs relative z-10 text-text-secondary">
					{#if user.email}
						<div class="flex items-center gap-2">
							<Mail size={ 14 } class="text-text-muted shrink-0" />
							<span class="truncate">{ user.email }</span>
						</div>
					{/if}

					{#if user.phone}
						<div class="flex items-center gap-2">
							<Phone size={ 14 } class="text-text-muted shrink-0" />
							<span class="truncate">{ user.phone }</span>
						</div>
					{/if}
				</div>

				<!-- Footer Actions -->
				<div class="flex items-center justify-end border-t border-border/40 pt-3 mt-0 relative z-10 text-xs">
					<div class="flex items-center gap-1.5 shrink-0">
						<a href="/users/form?id={ user.id }">
							<button
								class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300 cursor-pointer"
								title="Editar usuario"
							>
								<Edit2 size={ 14 } />
							</button>
						</a>

						<button
							onclick={ () => onDelete( user ) }
							class="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
							title="Eliminar usuario"
						>
							<Trash2 size={ 14 } />
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
