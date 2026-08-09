<script lang="ts">
	import { deserialize }  from '$app/forms';
	import { goto }         from '$app/navigation';
	import { page }         from '$app/state';

	import { ArrowLeft, CalendarDays, Bolt, Trash2 } from '@lucide/svelte';

	import type {
        EventConfig,
        EventStatus
    }                       from '$lib/types/index.js';
    import Button           from '$lib/components/ui/Button.svelte';
	import Modal            from '$lib/components/ui/Modal.svelte';
	import { eventsStore }  from '$lib/stores/events.svelte.js';
	import InputText        from '$lib/components/ui/InputText.svelte';
	import InputNumber      from '$lib/components/ui/InputNumber.svelte';
	import DatePicker       from '$lib/components/ui/DatePicker.svelte';
	import Select           from '$lib/components/ui/Select.svelte';
	import Checkbox         from '$lib/components/ui/Checkbox.svelte';


	interface Props {
		data: {
			event: EventConfig | null;
		};
	}


    let { data }: Props = $props();

	// Identificar si estamos editando o creando mediante query parameter
	const eventId = $derived( page.url.searchParams.get( 'id' ) );
	const isEdit  = $derived( !!eventId );


    type FormData = Omit<EventConfig, 'id' | 'created_at' | 'updated_at'>;

    // svelte-ignore state_referenced_locally
	let form = $state<FormData>({
		event_name                 : data.event?.event_name                ?? '',
		event_date                 : data.event?.event_date                ?? '',
		registration_deadline      : data.event?.registration_deadline     ?? '',
		detect_by_minors           : data.event?.detect_by_minors          ?? false,
		status                     : data.event?.status                    ?? 'DRAFT',
		max_family_members         : data.event?.max_family_members        ?? null,
		max_guests_per_family      : data.event?.max_guests_per_family     ?? null,
		require_guest_verification : data.event?.require_guest_verification ?? false,
	});


    let errorMsg        = $state<string | null>( null );
	let isSaving        = $state( false );
	let deleteModalOpen = $state( false );
	let deleteError     = $state<string | null>( null );
	let isDeleting      = $state( false );
    let errors          = $state<Record<string, string | null>>( {
		event_name            : null,
		event_date            : null,
		registration_deadline : null,
	} );


    const statusOptions: Array<{ value: EventStatus; label: string }> = [
		{ value: 'DRAFT',       label: 'Borrador' },
		{ value: 'IN_PROGRESS', label: 'En Curso' },
		{ value: 'FINISHED',    label: 'Finalizado' },
		{ value: 'CANCELLED',   label: 'Cancelado' }
	];


    async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();
		errorMsg = null;

		errors = {
			event_name            : null,
			event_date            : null,
			registration_deadline : null,
		};

		let hasError = false;

		if ( !form.event_name.trim() ) {
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

		isSaving = true;

		const formData = new FormData();

        formData.append( 'event_name',                 form.event_name.trim() );
		formData.append( 'event_date',                 form.event_date );
		formData.append( 'registration_deadline',      form.registration_deadline );
		formData.append( 'status',                     form.status );
		formData.append( 'detect_by_minors',           String( form.detect_by_minors ) );
		formData.append( 'require_guest_verification', String( form.require_guest_verification ) );

		if ( form.max_family_members != null ) {
			formData.append( 'max_family_members', String( form.max_family_members ) );
		}

        if ( form.max_guests_per_family != null ) {
			formData.append( 'max_guests_per_family', String( form.max_guests_per_family ) );
		}

		const actionUrl = isEdit ? `?id=${ eventId }&/save` : '?/save';

		try {
			const response = await fetch( actionUrl, {
				method : 'POST',
				body   : formData,
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				const event = ( result.data as any )?.event;

                if ( event ) {
					if ( isEdit ) {
						eventsStore.update( event );
					} else {
						eventsStore.add( event );
					}

                    goto( '/events' );
				} else {
					errorMsg = 'No se recibió la información del evento procesado.';
				}
			} else if ( result.type === 'failure' ) {
				errorMsg = ( result.data as any )?.error ?? 'Error al guardar el evento.';
			} else if ( result.type === 'error' ) {
				errorMsg = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			errorMsg = ( err as Error ).message;
		} finally {
			isSaving = false;
		}
	}

	async function confirmDelete(): Promise<void> {
		if ( !eventId ) return;

        isDeleting  = true;
		deleteError = null;

		const formData = new FormData();

		try {
			const response = await fetch( `?id=${ eventId }&/delete`, {
				method : 'POST',
				body   : formData,
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				eventsStore.remove( eventId );

                goto( '/events' );
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error ?? 'Error al eliminar el evento.';
			} else if ( result.type === 'error' ) {
				deleteError = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			deleteError = ( err as Error ).message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>{ isEdit ? 'Editar Evento' : 'Nuevo Evento' } — FamiPass Admin</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a
				href={ isEdit ? `/events/${ eventId }` : '/events' }
				class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted transition-all duration-300"
				aria-label="Volver"
			>
				<ArrowLeft size={20} />
			</a>

            <div>
				<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Evento' : 'Nuevo Evento' }
				</h1>

                <p class="text-sm text-text-secondary mt-1">
					{ isEdit ? ( data.event?.event_name ?? '' ) : 'Configura los detalles del nuevo evento' }
				</p>
			</div>
		</div>

		{#if isEdit && data.event?.status === 'DRAFT'}
			<button
				onclick={() => { deleteError = null; deleteModalOpen = true; }}
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                    transition-all duration-300 cursor-pointer"
			>
				<Trash2 size={16} />
				Eliminar Borrador
			</button>
		{/if}
	</div>

	<form onsubmit={handleSubmit} class="space-y-6">

		<!-- Basic Info -->
		<div class="p-6 space-y-6 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
			<div class="flex items-center gap-2.5">
				<CalendarDays size={20} class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
				<h2 class="font-bold text-lg text-text-primary">Información básica</h2>
			</div>

			<InputText
				label="Nombre del evento"
				id="event-name"
				placeholder="Ej: Retiro Familiar 2026"
				required={ true }
				bind:value={ form.event_name }
				error={ errors.event_name }
			/>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<DatePicker
					label="Fecha del evento"
					id="event-date"
					required={ true }
					bind:value={ form.event_date }
					error={ errors.event_date }
				/>

                <DatePicker
					label="Fecha límite de registro"
					id="reg-deadline"
					required={ true }
					bind:value={ form.registration_deadline }
					error={ errors.registration_deadline }
				/>
			</div>

			<Select
				label="Estado"
				placeholder="Selecciona el estado"
				required={ true }
				options={ statusOptions }
				bind:value={ form.status }
			/>
		</div>

		<!-- Limits & Validation -->
		<div class="p-6 space-y-6 rounded-2xl bg-calypso-100/20 dark:bg-zinc-950/20 border border-border/80 hover:border-accent/30 hover:shadow-lg transition-all duration-300">
			<div class="flex items-center gap-2.5">
				<Bolt size={20} class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
				<h2 class="font-bold text-lg text-text-primary">Límites y validación</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<InputNumber
					label="Máx. miembros por familia"
					id="max-members"
					min={ 1 }
					placeholder="Sin límite"
					bind:value={ form.max_family_members }
				/>

                <InputNumber
					label="Máx. huéspedes por familia"
					id="max-guests"
					min={ 0 }
					placeholder="Sin límite"
					bind:value={ form.max_guests_per_family }
				/>
			</div>

			<div class="space-y-4">
				<Checkbox
					label="Detectar menores de edad"
					description="Aplica porciones especiales para menores en las órdenes"
					id="detect-minors"
					bind:checked={ form.detect_by_minors }
				/>

                <Checkbox
					label="Verificación de huéspedes requerida"
					description="Los huéspedes deben ser verificados antes del evento"
					id="require-verification"
					bind:checked={ form.require_guest_verification }
				/>
			</div>
		</div>

		{#if errorMsg}
			<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
				{errorMsg}
			</div>
		{/if}

		<div class="flex gap-3 justify-end">
			<a href={ isEdit ? `/events/${ eventId }` : '/events' }>
				<Button variant="secondary" class="hover:text-accent hover:bg-accent-muted/30 transition-all duration-300">
					Cancelar
				</Button>
			</a>

            <Button
				type="submit"
				variant="primary"
				loading={ isSaving }
			>
				{ isEdit ? 'Guardar Cambios' : 'Crear Evento' }
			</Button>
		</div>
	</form>
</div>

<!-- Modal de Eliminación -->
<Modal
	open={deleteModalOpen}
	onClose={() => deleteModalOpen = false}
	onConfirm={confirmDelete}
	title="Eliminar Evento"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={isDeleting}
>
	<p>¿Estás seguro de que deseas eliminar el evento <strong class="text-text-primary">"{data.event?.event_name}"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{deleteError}</p>
	{/if}
</Modal>
