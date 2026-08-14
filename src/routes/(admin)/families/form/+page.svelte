<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page }             from '$app/state';

	import { ArrowLeft, Users, Plus, Trash2, Crown, User as UserIcon } from '@lucide/svelte';

	import type { Family, FamilyMember, CommunityOrganization } from '$lib/types/index.js';
	import Button                                                from '$lib/components/ui/Button.svelte';
	import InputText                                             from '$lib/components/ui/InputText.svelte';
	import FamilyMemberForm                                      from '../components/FamilyMemberForm.svelte';
	import Modal                                                 from '$lib/components/ui/Modal.svelte';
	import { getOrgLabel }                                       from '../utils/constants.js';


	interface Props {
		data: {
			family : Family | null;
		};
	}


	interface FormState {
		family_name : string;
	}


	type LocalMember = Omit<FamilyMember, 'id' | 'family_id' | 'created_at' | 'updated_at' | 'family'>;


	let { data }: Props = $props();


	const id     = $derived( page.url.searchParams.get( 'id' ) );
	const isEdit = $derived( !!id );


	let errorMsg        = $state<string | null>( null );
	let isSaving        = $state( false );
	let showMemberModal = $state( false );
	let members         = $state<LocalMember[]>( [] );

	let errors   = $state<Record<string, string | null>>( {
		family_name : null
	} );

	// svelte-ignore state_referenced_locally
	let form = $state<FormState>( {
		family_name : data.family?.family_name ?? ''
	} );


	function handleAddMember( data: {
		full_name         : string;
		rut               : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
	} ): void {
		members = [ ...members, data ];
		showMemberModal = false;
	}

	function removeMember( index: number ): void {
		members = members.filter( ( _, i ) => i !== index );
	}

	async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();

		errorMsg = null;

		errors = {
			family_name : null
		};

		let hasError = false;

		if ( !form.family_name.trim() ) {
			errors.family_name = 'El nombre de la familia es requerido.';
			hasError = true;
		}

		if ( hasError ) return;

		isSaving = true;

		const formData = new FormData();
		formData.append( 'family_name', form.family_name.trim() );

		if ( !isEdit ) {
			formData.append( 'members', JSON.stringify( members ) );
		}

		const actionUrl = isEdit ? `?id=${ id }&/save` : '?/save';

		try {
			const response = await fetch( actionUrl, {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:families' );

				goto( '/families' );
			} else if ( result.type === 'failure' ) {
				errorMsg = ( result.data as any )?.error ?? 'Error al guardar la familia.';
			} else if ( result.type === 'error' ) {
				errorMsg = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			errorMsg = ( err as Error ).message;
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>{ isEdit ? 'Editar Familia' : 'Nueva Familia' } — FamiPass Admin</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a
				href="/families"
				class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300"
				aria-label="Volver"
			>
				<ArrowLeft size={ 20 } />
			</a>

			<div>
				<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Familia' : 'Nueva Familia' }
				</h1>

				<p class="text-sm text-text-secondary mt-1">
					{ isEdit ? `Modificando datos de familia: ${ data.family?.family_name }` : 'Ingresa los datos de la nueva familia' }
				</p>
			</div>
		</div>
	</div>

	<form onsubmit={ handleSubmit } class="space-y-6">
		<!-- Información de la Familia -->
		<div class="p-6 space-y-6 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
			<div class="flex items-center gap-2.5">
				<Users size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />

				<h2 class="font-bold text-lg text-text-primary">Información de la familia</h2>
			</div>

			<div class="grid grid-cols-1 gap-4">
				<InputText
					label="Nombre de la familia"
					id="family-name"
					required={ true }
					placeholder="Ej: Familia Pérez"
					bind:value={ form.family_name }
					error={ errors.family_name }
				/>
			</div>
		</div>

		{#if !isEdit}
			<!-- Integrar miembros de la familia -->
			<div class="p-6 space-y-6 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-2.5">
						<Users size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
						<h2 class="font-bold text-lg text-text-primary">Miembros de la familia</h2>
					</div>
					<Button
						type="button"
						variant="secondary"
						onclick={ () => showMemberModal = true }
						class="text-xs font-semibold py-1.5 px-3 border border-border hover:border-accent hover:text-accent hover:bg-accent-muted/20 transition-all duration-300"
					>
						<Plus size={ 14 } />
						Agregar Miembro
					</Button>
				</div>

				{#if members.length === 0}
					<p class="text-sm text-text-muted text-center py-6 bg-bg-surface-2/45 rounded-xl border border-dashed border-border/60">
						No se han agregado miembros locales aún.
					</p>
				{:else}
					<div class="overflow-x-auto rounded-xl border border-border bg-bg-surface-2/30">
						<table class="w-full text-sm text-left">
							<thead>
								<tr class="border-b border-border bg-bg-surface-2 select-none">
									<th class="px-4 py-3 font-semibold text-text-secondary">Nombre</th>
									<th class="px-4 py-3 font-semibold text-text-secondary">RUT</th>
									<th class="px-4 py-3 font-semibold text-text-secondary">Organización</th>
									<th class="px-4 py-3 font-semibold text-text-secondary text-center">Representante</th>
									<th class="px-4 py-3 font-semibold text-text-secondary text-right">Acciones</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/60">
								{#each members as m, i}
									<tr class="hover:bg-bg-surface-2/20 transition-colors">
										<td class="px-4 py-3 text-text-primary font-medium flex items-center gap-2">
											{#if m.is_representative}
												<Crown size={ 14 } class="text-accent shrink-0" />
											{:else}
												<UserIcon size={ 14 } class="text-text-muted shrink-0" />
											{/if}
											{ m.full_name }
										</td>
										<td class="px-4 py-3 text-text-secondary font-mono">{ m.rut }</td>
										<td class="px-4 py-3 text-text-secondary">{ getOrgLabel( m.organization ) }</td>
										<td class="px-4 py-3 text-center">
											{#if m.is_representative}
												<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-muted text-accent">Sí</span>
											{:else}
												<span class="text-text-muted text-xs">—</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-right">
											<button
												type="button"
												onclick={ () => removeMember( i ) }
												class="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
											>
												<Trash2 size={ 14 } />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}

		{#if errorMsg}
			<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
				{ errorMsg }
			</div>
		{/if}

		<div class="flex gap-3 justify-end">
			<a href="/families">
				<Button variant="secondary" class="hover:text-accent hover:bg-accent-muted/30 transition-all duration-300">
					Cancelar
				</Button>
			</a>

			<Button
				type="submit"
				variant="primary"
				loading={ isSaving }
			>
				{ isEdit ? 'Guardar Cambios' : 'Crear Familia' }
			</Button>
		</div>
	</form>
</div>

<!-- Modal para agregar miembros en creación -->
<Modal
	open={ showMemberModal }
	onClose={ () => showMemberModal = false }
	title="Agregar Miembro"
>
	<FamilyMemberForm
		onSubmit={ handleAddMember }
		onCancel={ () => showMemberModal = false }
		submitLabel="Agregar"
	/>
</Modal>
