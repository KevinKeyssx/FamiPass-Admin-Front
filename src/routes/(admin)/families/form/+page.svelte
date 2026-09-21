<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page }             from '$app/state';

	import { Plus, Trash2, Crown, User as UserIcon } from '@lucide/svelte';

	import type {
		Family,
		FamilyMember,
		CommunityOrganization,
		FamilyMemberRole
	}                                   from '$lib/types/index.js';
    import {
        getOrgLabel,
		getFamilyRoleLabel,
		getFamilyRoleBadgeStyles
	}                               from '../utils/constants.js';
	import Button                   from '$lib/components/ui/Button.svelte';
	import InputText                from '$lib/components/ui/InputText.svelte';
	import FamilyMemberForm         from '../components/FamilyMemberForm.svelte';
	import Modal                    from '$lib/components/ui/Modal.svelte';
    import ButtonBack               from '$lib/components/ui/ButtonBack.svelte';


	interface Props {
		data : {
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
	let errors          = $state<Record<string, string | null>>( {
		family_name : null
	});

	// svelte-ignore state_referenced_locally
	let form = $state<FormState>( {
		family_name : data.family?.family_name ?? ''
	});


    function handleAddMember( data : {
		full_name         : string;
		rut?              : string;
		email?            : string;
		phone             : string;
		organization      : CommunityOrganization;
		is_representative : boolean;
		role              : FamilyMemberRole;
	}): void {
		members         = [ ...members, data as LocalMember ];
		showMemberModal = false;
	}


    function removeMember( index : number ): void {
		members = members.filter( ( _, i ) => i !== index );
	}


    async function handleSubmit( e : SubmitEvent ): Promise<void> {
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
				errorMsg = ( result.data as any )?.error ?? 'Ocurrió un error al guardar la familia.';
			} else {
				errorMsg = 'Ocurrió un error inesperado al procesar la solicitud.';
			}
		} catch ( err : any ) {
			errorMsg = err.message;
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>{ isEdit ? 'Editar Familia' : 'Nueva Familia' } — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/families" />

			<div class="space-y-0.5">
				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Familia' : 'Nueva Familia' }
				</h1>
				<p class="text-xs text-text-secondary">
					{ isEdit ? 'Modifica los datos principales del grupo familiar' : 'Completa la información para crear una nueva familia en el sistema' }
				</p>
			</div>
		</div>
	</div>

	<!-- Formulario Principal -->
	<form onsubmit={ handleSubmit } class="space-y-6">
		<div class="card p-6 space-y-6">
			<div>
				<h2 class="text-base font-bold text-text-primary mb-1">Información General</h2>
				<p class="text-xs text-text-secondary">Nombre o apellido representativo del grupo familiar</p>
			</div>

			<div class="grid grid-cols-1 gap-6 max-w-xl">
				<InputText
					label="Nombre o Apellido de la Familia"
					id="family-name"
					required={ true }
					placeholder="Ej: Familia González Pérez"
					bind:value={ form.family_name }
					error={ errors.family_name }
					disabled={ isSaving }
				/>
			</div>
		</div>

		<!-- Sección de Miembros Iniciales (Solo en creación) -->
		{#if !isEdit}
			<div class="card p-6 space-y-6">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h2 class="text-base font-bold text-text-primary mb-1">Miembros Iniciales</h2>
						<p class="text-xs text-text-secondary">Puedes agregar a los primeros integrantes de esta familia de forma opcional</p>
					</div>

					<Button
						type="button"
						variant="secondary"
						onclick={ () => { showMemberModal = true; } }
						class="flex items-center gap-2 self-start sm:self-auto hover:border-accent transition-all duration-300"
					>
						<Plus size={ 16 } />
						<span>Agregar Integrante</span>
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
									<!-- RUT comentado: ya no se solicita -->
									<!-- <th class="px-4 py-3 font-semibold text-text-secondary">RUT</th> -->
									<th class="px-4 py-3 font-semibold text-text-secondary">Organización</th>

                                    <th class="px-4 py-3 font-semibold text-text-secondary">Rol</th>

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
										<!-- RUT comentado: ya no se solicita -->
										<!-- <td class="px-4 py-3 text-text-secondary font-mono">{ m.rut }</td> -->
										<td class="px-4 py-3 text-text-secondary">{ getOrgLabel( m.organization ) }</td>

                                        <td class="px-4 py-3 text-text-secondary">
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border { getFamilyRoleBadgeStyles( m.role ) }">
												{ getFamilyRoleLabel( m.role ) }
											</span>
										</td>

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
			<p class="text-red-500 text-sm">{ errorMsg }</p>
		{/if}

		<div class="flex items-center justify-end gap-3 pt-4">
			<Button type="button" variant="secondary" onclick={ () => goto( '/families' ) }>
				Cancelar
			</Button>

			<Button type="submit" variant="primary" loading={ isSaving }>
				{ isEdit ? 'Guardar Cambios' : 'Crear Familia' }
			</Button>
		</div>
	</form>
</div>

<!-- Modal para agregar miembro inicial -->
<Modal
	open    = { showMemberModal }
	onClose = { () => { showMemberModal = false; } }
	title   = "Agregar Integrante Familiar"
	size    = "lg"
>
	<FamilyMemberForm
		onSubmit    = { handleAddMember }
		onCancel    = { () => { showMemberModal = false; } }
		submitLabel = "Agregar a la lista"
	/>
</Modal>
