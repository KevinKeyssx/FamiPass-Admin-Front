<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page }             from '$app/state';

	import {
		today,
		getLocalTimeZone,
		parseDate,
		CalendarDate
	}                                                         from '@internationalized/date';
	import { CalendarDays, Bolt, Trash2, ShoppingBag, Plus }  from '@lucide/svelte';

	import type { EventConfig, Product }        from '$lib/types/index.js';
	import { isEventExpired, hasEventStarted }  from '$lib/utils/date.js';
	import Button                               from '$lib/components/ui/Button.svelte';
	import Modal                                from '$lib/components/ui/Modal.svelte';
	import InputText                            from '$lib/components/ui/InputText.svelte';
	import InputNumber                          from '$lib/components/ui/InputNumber.svelte';
	import DatePicker                           from '$lib/components/ui/DatePicker.svelte';
	import Select                               from '$lib/components/ui/Select.svelte';
	import Checkbox                             from '$lib/components/ui/Checkbox.svelte';
	import ButtonBack                           from '$lib/components/ui/ButtonBack.svelte';


	interface Props {
		data : {
			event             : EventConfig | null;
			availableProducts : Product[];
			isSuperAdmin      : boolean;
		};
	}


	let { data }: Props = $props();


	const eventId = $derived( page.url.searchParams.get( 'id' ) );
	const isEdit  = $derived( !!eventId );


	interface LocalFormData extends Omit<EventConfig, 'id' | 'created_at' | 'updated_at' | 'expires_at'> {
		expires_at : string;
	}

	interface SelectedProductItem {
		product_id   : string;
		name         : string;
		quantity     : number;
		max_quantity : number | null;
		stock        : number | null;
	}

	// svelte-ignore state_referenced_locally
	let form = $state<LocalFormData>({
		event_name                 : data.event?.event_name                 ?? '',
		event_date                 : data.event?.event_date                 ?? '',
		registration_deadline      : data.event?.registration_deadline      ?? '',
		expires_at                 : data.event?.expires_at                 ?? '',
		detect_by_minors           : data.event?.detect_by_minors           ?? false,
		status                     : data.event?.status                     ?? 'DRAFT',
		max_family_members         : data.event?.max_family_members         ?? null,
		max_guests_per_family      : data.event?.max_guests_per_family      ?? null,
		require_guest_verification : data.event?.require_guest_verification ?? false
	});

	// svelte-ignore state_referenced_locally
	let selectedProducts = $state<SelectedProductItem[]>(
		( data.event?.event_products ?? [] ).map( ( ep ) => ({
			product_id   : ep.product_id,
			name         : ep.product?.name ?? 'Producto',
			quantity     : ep.quantity,
			max_quantity : ep.max_quantity ?? null,
			stock        : ep.stock ?? null
		}) )
	);

	let productToAdd    = $state( '' );
	let productsError   = $state<string | null>( null );
	let errorMsg        = $state<string | null>( null );
	let isSaving        = $state( false );
	let deleteModalOpen = $state( false );
	let deleteError     = $state<string | null>( null );
	let isDeleting      = $state( false );
	let prevEventDate   = $state( form.event_date );
	let errors          = $state<Record<string, string | null>>({
		event_name            : null,
		event_date            : null,
		registration_deadline : null
	});


	const isExpired = $derived( data.event?.expires_at ? isEventExpired( data.event.expires_at ) : false );

	const hasStarted = $derived(
		isEdit && data.event?.event_date ? hasEventStarted( data.event.event_date ) : false
	);


	function isFieldDisabled( fieldName: string ): boolean {
		if ( isSaving ) return true;
		if ( hasStarted && !data.isSuperAdmin ) {
			return true;
		}
		if ( isExpired ) {
			if ( fieldName === 'expires_at' && data.isSuperAdmin ) {
				return false;
			}
			return true;
		}
		return false;
	}


	const unselectedProducts = $derived(
		( data.availableProducts ?? [] ).filter( ( ap ) =>
			!selectedProducts.some( ( sp ) => sp.product_id === ap.id )
		)
	);

	const productOptions = $derived(
		unselectedProducts.map( ( p ) => ({
			value : p.id,
			label : p.name
		}) )
	);

	function handleAddProduct(): void {
		if ( !productToAdd ) return;
		const found = data.availableProducts.find( ( p ) => p.id === productToAdd );
		if ( !found ) return;

		selectedProducts.push({
			product_id   : found.id,
			name         : found.name,
			quantity     : 1,
			max_quantity : null,
			stock        : null
		});
		productToAdd  = '';
		productsError = null;
	}

	function handleRemoveProduct( productId: string ): void {
		selectedProducts = selectedProducts.filter( ( p ) => p.product_id !== productId );
	}


	const statusOptionsEdit = $derived(
		data.event?.status === 'DRAFT'
			? [
				{ value: 'DRAFT',       label: 'Borrador' },
				{ value: 'IN_PROGRESS', label: 'En Curso' },
				{ value: 'FINISHED',    label: 'Finalizado' },
				{ value: 'CANCELLED',   label: 'Cancelado' }
			]
			: [
				{ value: 'IN_PROGRESS', label: 'En Curso' },
				{ value: 'FINISHED',    label: 'Finalizado' },
				{ value: 'CANCELLED',   label: 'Cancelado' }
			]
	);


	$effect( () => {
		if ( form.event_date && form.event_date !== prevEventDate ) {
			form.registration_deadline = form.event_date;
			prevEventDate = form.event_date;
		}
	});


	function disableEventDate( date: CalendarDate ): boolean {
		const tomorrow = today( getLocalTimeZone() ).add( { days: 1 } );
		return date.compare( tomorrow ) < 0;
	}


	function disableRegDeadline( date: CalendarDate ): boolean {
		if ( !form.event_date ) return true;

		const eventDateVal = parseDate( form.event_date.slice( 0, 10 ) );
		const todayVal     = today( getLocalTimeZone() );

		return date.compare( todayVal ) < 0 || date.compare( eventDateVal ) > 0;
	}


	function disableExpiresAt( date: CalendarDate ): boolean {
		if ( !form.registration_deadline ) return true;

		const regDeadlineVal = parseDate( form.registration_deadline.slice( 0, 10 ) );

		return date.compare( regDeadlineVal ) < 0;
	}


	const isRegDeadlineDisabled = $derived( !form.event_date || isFieldDisabled( 'registration_deadline' ) );


	async function handleSubmit( e: SubmitEvent ): Promise<void> {
		e.preventDefault();
		errorMsg      = null;
		productsError = null;

		errors = {
			event_name            : null,
			event_date            : null,
			registration_deadline : null
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

		if ( selectedProducts.length === 0 ) {
			productsError = 'Debes asociar al menos un producto al evento.';
			hasError = true;
		} else {
			const hasInvalidQuantity = selectedProducts.some( ( p ) => !p.quantity || p.quantity < 1 );
			if ( hasInvalidQuantity ) {
				productsError = 'La cantidad de cada producto debe ser al menos 1.';
				hasError = true;
			}

			const hasStockExceedingMax = selectedProducts.some( ( p ) =>
				p.max_quantity !== null &&
				p.stock !== null &&
				p.stock !== undefined &&
				p.max_quantity !== undefined &&
				p.stock > p.max_quantity
			);
			if ( hasStockExceedingMax ) {
				productsError = 'El stock actual no puede ser mayor que la cantidad máxima total permitida.';
				hasError = true;
			}
		}

		if ( hasError ) return;

		isSaving = true;

		const formData = new FormData();

		formData.append( 'event_name', form.event_name.trim() );
		formData.append( 'event_date', form.event_date );
		formData.append( 'registration_deadline', form.registration_deadline );
		formData.append( 'expires_at', form.expires_at || '' );
		formData.append( 'status', form.status );
		formData.append( 'detect_by_minors', String( form.detect_by_minors ) );
		formData.append( 'require_guest_verification', String( form.require_guest_verification ) );
		formData.append( 'products', JSON.stringify( selectedProducts.map( ( p ) => ({
			product_id   : p.product_id,
			quantity     : p.quantity,
			max_quantity : p.max_quantity ?? null,
			stock        : p.stock ?? null
		}) ) ) );

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
				body   : formData
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				const event = ( result.data as any )?.event;

				if ( event ) {
					await invalidate( 'app:events' );
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
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:events' );
				deleteModalOpen = false;
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
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href={ isEdit ? `/events/${ eventId }` : '/events' } />

			<div class="space-y-0.5">
				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					{ isEdit ? 'Editar Evento' : 'Nuevo Evento' }
				</h1>

				<p class="text-xs text-text-secondary">
					{ isEdit ? ( data.event?.event_name ?? '' ) : 'Configura los detalles del nuevo evento' }
				</p>
			</div>
		</div>

		{#if isEdit && data.event?.status === 'DRAFT'}
			<button
				onclick={ () => { deleteError = null; deleteModalOpen = true; } }
				disabled={ isFieldDisabled( 'delete' ) }
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative z-10
					text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
					transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Trash2 size={ 16 } />
				Eliminar Borrador
			</button>
		{/if}
	</div>

	{#if hasStarted && !data.isSuperAdmin}
		<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm flex flex-col gap-1.5">
			<p class="font-bold flex items-center gap-2">
				<span>⚠️</span> Este evento ya comenzó o finalizó (Fecha: { data.event?.event_date }).
			</p>
			<p>Solo un Super Administrador puede modificar los datos y productos de este evento.</p>
		</div>
	{/if}

	{#if isExpired}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex flex-col gap-1.5">
			<p class="font-bold flex items-center gap-2">
				<span>⚠️</span> Este evento ha expirado (Fin Canje: { data.event?.expires_at })
			</p>
			{#if data.isSuperAdmin}
				<p>Como Super Administrador, solo puedes modificar la fecha límite de canje (Expiración). Todos los demás campos están bloqueados.</p>
			{:else}
				<p>El evento está bloqueado. Solo un Super Administrador puede modificar la fecha límite de canje.</p>
			{/if}
		</div>
	{/if}

	<form onsubmit={ handleSubmit } class="space-y-6">
		<!-- Basic Info -->
		<div class="form-card">
			<div class="flex items-center gap-2.5">
				<CalendarDays size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
				<h2 class="font-bold text-lg text-text-primary">Información básica</h2>
			</div>

			<InputText
				label="Nombre del evento"
				id="event-name"
				placeholder="Ej: Retiro Familiar 2026"
				bind:value={ form.event_name }
				error={ errors.event_name }
				disabled={ isFieldDisabled( 'event_name' ) }
			/>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<DatePicker
					label="Fecha del evento"
					id="event-date"
					required={ true }
					bind:value={ form.event_date }
					error={ errors.event_date }
					isDateDisabled={ disableEventDate }
					disabled={ isFieldDisabled( 'event_date' ) }
				/>

				<DatePicker
					label="Fecha límite de registro"
					id="reg-deadline"
					required={ true }
					bind:value={ form.registration_deadline }
					error={ errors.registration_deadline }
					disabled={ isRegDeadlineDisabled || isSaving }
					isDateDisabled={ disableRegDeadline }
				/>
			</div>

			<div class="flex items-end gap-2">
				<div class="flex-1">
					<DatePicker
						label="Fecha límite de canje (Expiración)"
						id="expires-at"
						bind:value={ form.expires_at }
						disabled={ isFieldDisabled( 'expires_at' ) }
						isDateDisabled={ disableExpiresAt }
					/>
				</div>
				{#if form.expires_at && !isFieldDisabled( 'expires_at' )}
					<button
						type="button"
						onclick={ () => { form.expires_at = ''; } }
						class="px-3 py-2 text-xs text-red-500 hover:underline font-semibold cursor-pointer shrink-0 border border-red-500/20 hover:bg-red-500/5 rounded-xl h-10.5 flex items-center justify-center transition-all duration-300"
					>
						Limpiar
					</button>
				{/if}
			</div>

			{#if isEdit}
				<Select
					label="Estado"
					placeholder="Selecciona el estado"
					required={ true }
					options={ statusOptionsEdit }
					bind:value={ form.status }
					disabled={ isFieldDisabled( 'status' ) }
				/>
			{/if}
		</div>

		<!-- Event Products -->
		<div class="form-card">
			<div class="flex items-center justify-between gap-2.5">
				<div class="flex items-center gap-2.5">
					<ShoppingBag size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
					<h2 class="font-bold text-lg text-text-primary">Productos del evento</h2>
				</div>

				<span class="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
					{ selectedProducts.length } { selectedProducts.length === 1 ? 'producto' : 'productos' }
				</span>
			</div>

			<p class="text-xs text-text-secondary -mt-1">
				Asocia los productos que se entregarán en este evento y la cantidad de cada uno. Debe tener al menos 1 producto.
			</p>

			{#if !isFieldDisabled( 'products' ) && unselectedProducts.length > 0}
				<div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 p-3 rounded-xl bg-bg-surface-2/60 border border-border/40">
					<div class="flex-1">
						<Select
							label="Seleccionar producto"
							placeholder="Elige un producto para agregar"
							options={ productOptions }
							bind:value={ productToAdd }
							disabled={ isFieldDisabled( 'products' ) }
						/>
					</div>

					<Button
						type="button"
						variant="secondary"
						disabled={ !productToAdd || isFieldDisabled( 'products' ) }
						onclick={ handleAddProduct }
						class="h-10.5 sm:mb-0 shrink-0 flex items-center justify-center gap-1.5"
					>
						<Plus size={ 16 } />
						Agregar
					</Button>
				</div>
			{/if}

			{#if selectedProducts.length === 0}
				<div class="p-6 rounded-xl border border-dashed border-border/70 flex flex-col items-center justify-center text-center gap-2 text-text-muted">
					<ShoppingBag size={ 32 } class="opacity-30" />
					<p class="text-sm font-medium">No hay productos asociados a este evento.</p>
					<p class="text-xs">Selecciona un producto del catálogo para asociarlo.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each selectedProducts as prod, idx ( prod.product_id )}
						<div class="p-3.5 sm:p-4 rounded-xl bg-bg-surface-2 border border-border/40 transition-all hover:border-border space-y-3">
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-3 min-w-0">
									<div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 font-bold text-xs">
										{ idx + 1 }
									</div>
									<div class="truncate">
										<p class="text-sm font-semibold text-text-primary truncate">{ prod.name }</p>
									</div>
								</div>

								<button
									type="button"
									onclick={ () => handleRemoveProduct( prod.product_id ) }
									disabled={ isFieldDisabled( 'products' ) }
									class="p-2 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
									title="Eliminar producto"
									aria-label="Eliminar producto"
								>
									<Trash2 size={ 16 } />
								</button>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<InputNumber
									label="Por persona"
									min={ 1 }
									step={ 1 }
									required={ true }
									bind:value={ prod.quantity }
									disabled={ isFieldDisabled( 'products' ) }
								/>

								<InputNumber
									label="Máx. total"
									min={ 0 }
									step={ 1 }
									placeholder="Sin límite"
									bind:value={ prod.max_quantity }
									disabled={ isFieldDisabled( 'products' ) }
								/>

								<InputNumber
									label="Stock actual"
									min={ 0 }
									step={ 1 }
									placeholder="Opcional"
									bind:value={ prod.stock }
									disabled={ isFieldDisabled( 'products' ) }
								/>
							</div>

							{#if prod.max_quantity !== null && prod.max_quantity !== undefined && prod.stock !== null && prod.stock !== undefined && prod.stock > prod.max_quantity}
								<p class="text-xs text-red-500 font-medium">El stock actual ({ prod.stock }) no puede superar el límite máximo ({ prod.max_quantity }).</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if productsError}
				<p class="text-xs text-red-500 mt-1">{ productsError }</p>
			{/if}
		</div>

		<!-- Limits & Validation -->
		<div class="form-card">
			<div class="flex items-center gap-2.5">
				<Bolt size={ 20 } class="text-accent" style="filter: drop-shadow( 0 0 8px var(--accent) );" />
				<h2 class="font-bold text-lg text-text-primary">Límites y validación</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<InputNumber
					label="Máx. miembros por familia"
					id="max-members"
					min={ 1 }
					placeholder="Sin límite"
					bind:value={ form.max_family_members }
					disabled={ isFieldDisabled( 'max_family_members' ) }
				/>

				<InputNumber
					label="Máx. invitados por familia"
					id="max-guests"
					min={ 0 }
					placeholder="Sin límite"
					bind:value={ form.max_guests_per_family }
					disabled={ isFieldDisabled( 'max_guests_per_family' ) }
				/>
			</div>

			<div class="space-y-4">
				<Checkbox
					label="Detectar menores de edad"
					description="Aplica porciones especiales para menores en las órdenes"
					id="detect-minors"
					bind:checked={ form.detect_by_minors }
					disabled={ isFieldDisabled( 'detect_by_minors' ) }
				/>

				<Checkbox
					label="Verificación de invitados requerida"
					description="Los invitados deben ser verificados antes del evento"
					id="require-verification"
					bind:checked={ form.require_guest_verification }
					disabled={ isFieldDisabled( 'require_guest_verification' ) }
				/>
			</div>
		</div>

		{#if errorMsg}
			<div class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
				{ errorMsg }
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
				disabled={ ( isExpired && !data.isSuperAdmin ) || ( hasStarted && !data.isSuperAdmin ) }
			>
				{ isEdit ? 'Guardar Cambios' : 'Crear Evento' }
			</Button>
		</div>
	</form>
</div>

<!-- Modal de Eliminación -->
<Modal
	open={ deleteModalOpen }
	onClose={ () => { deleteModalOpen = false; } }
	onConfirm={ confirmDelete }
	title="Eliminar Evento"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar el evento <strong class="text-text-primary">"{ data.event?.event_name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
