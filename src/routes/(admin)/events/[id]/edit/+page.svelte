<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { goto }               from '$app/navigation';
	import { page }               from '$app/stores';
	import { INTERNAL_ENDPOINT }  from '$lib/utils/endpoints.js';
	import Button                 from '$lib/components/ui/Button.svelte';
	import Modal                  from '$lib/components/ui/Modal.svelte';
	import type { EventConfig, EventStatus } from '$lib/types/index.js';
	import { ArrowLeft, Trash2 }  from '@lucide/svelte';

	import InputText   from '$lib/components/ui/InputText.svelte';
	import InputNumber from '$lib/components/ui/InputNumber.svelte';
	import DatePicker  from '$lib/components/ui/DatePicker.svelte';
	import Select      from '$lib/components/ui/Select.svelte';
	import Checkbox    from '$lib/components/ui/Checkbox.svelte';

	const qc      = useQueryClient();
	const eventId = $derived( $page.params.id! );

	const eventQuery = createQuery<EventConfig>( () => ( {
		queryKey : [ 'events', eventId ],
		queryFn  : async () => {
			const res = await fetch( INTERNAL_ENDPOINT.events.detail( eventId ) );
			if ( !res.ok ) throw new Error( 'Evento no encontrado' );
			return res.json();
		},
	} ) );

	let form = $state<Partial<EventConfig>>( {} );

	$effect( () => {
		if ( eventQuery.data ) {
			form = { ...eventQuery.data };
		}
	} );

	let errorMsg        = $state<string | null>( null );
	let deleteModalOpen = $state( false );
	let deleteError     = $state<string | null>( null );

	let errors = $state<Record<string, string | null>>( {
		event_name            : null,
		event_date            : null,
		registration_deadline : null,
	} );

	const updateMut = createMutation<EventConfig, Error, Partial<EventConfig>>( () => ( {
		mutationFn: async ( data ) => {
			const res = await fetch( INTERNAL_ENDPOINT.events.update( eventId ), {
				method  : 'PATCH',
				headers : { 'Content-Type': 'application/json' },
				body    : JSON.stringify( data ),
			} );
			if ( !res.ok ) {
				const body = await res.json();
				throw new Error( body.error ?? 'Error al actualizar' );
			}
			return res.json();
		},
		onSuccess: () => {
			qc.invalidateQueries( { queryKey: [ 'events' ] } );
			goto( `/events/${ eventId }` );
		},
		onError: ( err ) => {
			errorMsg = err.message;
		},
	} ) );

	const deleteMut = createMutation<void, Error, void>( () => ( {
		mutationFn: async () => {
			const res = await fetch( INTERNAL_ENDPOINT.events.delete( eventId ), { method: 'DELETE' } );
			if ( !res.ok ) {
				const body = await res.json();
				throw new Error( body.error ?? 'Error al eliminar' );
			}
		},
		onSuccess: () => {
			qc.invalidateQueries( { queryKey: [ 'events' ] } );
			goto( '/events' );
		},
		onError: ( err ) => {
			deleteError = err.message;
		},
	} ) );

	const statusOptions: Array<{ value: EventStatus; label: string }> = [
		{ value: 'DRAFT',       label: 'Borrador' },
		{ value: 'IN_PROGRESS', label: 'En Curso' },
		{ value: 'FINISHED',    label: 'Finalizado' },
		{ value: 'CANCELLED',   label: 'Cancelado' },
	];

	function handleSubmit( e: SubmitEvent ): void {
		e.preventDefault();
		errorMsg = null;
		
		errors = {
			event_name            : null,
			event_date            : null,
			registration_deadline : null,
		};

		let hasError = false;

		if ( !form.event_name?.trim() ) {
			errors.event_name = 'El nombre del evento es requerido.';
			hasError = true;
		}
		if ( !form.event_date ) {
			errors.event_date = 'La fecha del evento es requerida.';
			hasError = true;
		}
		if ( !form.registration_deadline ) {
			errors.registration_deadline = 'La fecha límite de registro es requerida.';
			hasError = true;
		}

		if ( hasError ) return;

		updateMut.mutate( form );
	}
</script>

<svelte:head>
	<title>Editar Evento — FamiPass Admin</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a
				href="/events/{eventId}"
				class="p-2 rounded-xl text-(--text-muted) hover:text-(--accent) hover:bg-(--accent-muted) transition-all"
				aria-label="Volver"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-(--text-primary)">Editar Evento</h1>
				<p class="text-sm text-(--text-secondary) mt-0.5">{eventQuery.data?.event_name ?? ''}</p>
			</div>
		</div>

		{#if eventQuery.data?.status === 'DRAFT'}
			<button
				onclick={() => { deleteError = null; deleteModalOpen = true; }}
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
				       text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
				       transition-all duration-200"
			>
				<Trash2 size={16} />
				Eliminar Borrador
			</button>
		{/if}
	</div>

	{#if eventQuery.isLoading}
		<div class="card p-8 space-y-4">
			{#each [ 1, 2, 3, 4 ] as _}
				<div class="h-12 rounded-xl bg-(--bg-surface-2) animate-pulse"></div>
			{/each}
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">

			<div class="card p-6 space-y-5">
				<h2 class="font-semibold text-(--text-primary)">Información básica</h2>

				<InputText
					label="Nombre del evento"
					id="edit-name"
					required={ true }
					bind:value={ form.event_name! }
					error={ errors.event_name }
				/>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<DatePicker
						label="Fecha del evento"
						id="edit-date"
						required={ true }
						bind:value={ form.event_date! }
						error={ errors.event_date }
					/>
					<DatePicker
						label="Fecha límite de registro"
						id="edit-deadline"
						required={ true }
						bind:value={ form.registration_deadline! }
						error={ errors.registration_deadline }
					/>
				</div>

				<Select
					label="Estado"
					placeholder="Selecciona el estado"
					required={ true }
					options={ statusOptions }
					bind:value={ form.status! }
				/>
			</div>

			<div class="card p-6 space-y-5">
				<h2 class="font-semibold text-(--text-primary)">Límites y validación</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<InputNumber
						label="Máx. miembros por familia"
						id="edit-max-members"
						min={ 1 }
						placeholder="Sin límite"
						bind:value={ form.max_family_members! }
					/>
					<InputNumber
						label="Máx. huéspedes por familia"
						id="edit-max-guests"
						min={ 0 }
						placeholder="Sin límite"
						bind:value={ form.max_guests_per_family! }
					/>
				</div>

				<div class="space-y-3">
					<Checkbox
						label="Detectar menores de edad"
						description="Aplica porciones especiales para menores en las órdenes"
						id="edit-detect-minors"
						bind:checked={ form.detect_by_minors! }
					/>
					<Checkbox
						label="Verificación de huéspedes requerida"
						description="Los huéspedes deben ser verificados antes del evento"
						id="edit-require-verification"
						bind:checked={ form.require_guest_verification! }
					/>
				</div>
			</div>

			{#if errorMsg}
				<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
					{errorMsg}
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<a href="/events/{eventId}">
					<Button variant="secondary">Cancelar</Button>
				</a>
				<Button type="submit" variant="primary" loading={updateMut.isPending}>
					Guardar Cambios
				</Button>
			</div>

		</form>
	{/if}
</div>

<!-- Modal de Eliminación -->
<Modal
	open={deleteModalOpen}
	onClose={() => deleteModalOpen = false}
	onConfirm={() => deleteMut.mutate()}
	title="Eliminar Evento"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={deleteMut.isPending}
>
	<p>¿Estás seguro de que deseas eliminar el evento <strong class="text-(--text-primary)">"{eventQuery.data?.event_name}"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{deleteError}</p>
	{/if}
</Modal>
