<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { invalidateAll }    from '$app/navigation';

    import { Trash2, Users, ShoppingBasket, Plus, Check, X, Clock } from '@lucide/svelte';

    import { isEventExpired }   from '$lib/utils/date.js';
	import Button               from '$lib/components/ui/Button.svelte';
	import Modal                from '$lib/components/ui/Modal.svelte';
	import InputNumber          from '$lib/components/ui/InputNumber.svelte';
	import ButtonBack           from '$lib/components/ui/ButtonBack.svelte';


	interface Props {
		data: {
			event         : any;
			familyEvent   : any;
			orders        : any[];
			eventProducts : any[];
			isSuperAdmin  : boolean;
		};
	}


	let { data }: Props = $props();

	let isSubmitting    = $state( false );
	let submitError     = $state<string | null>( null );
	let deleteModalOpen = $state( false );
	let orderToDelete   = $state<string | null>( null );
	let isDeleting      = $state( false );
	let deleteError     = $state<string | null>( null );
    let formValues      = $state<Record<string, number>>( {} );


	const isExpired = $derived( data.event.expires_at ? isEventExpired( data.event.expires_at ) : false );



	$effect( () => {
		for ( const ep of data.eventProducts ) {
			const keyAdult = `qty_adult_${ ep.product_id }`;
			if ( formValues[ keyAdult ] === undefined ) {
				formValues[ keyAdult ] = 0;
			}
			const keyChild = `qty_child_${ ep.product_id }`;
			if ( formValues[ keyChild ] === undefined ) {
				formValues[ keyChild ] = 0;
			}
		}
	} );

	const members           = $derived( data.familyEvent.family?.members || [] );
	const totalMembersCount = $derived( members.length );

	const adultsCount = $derived(
		data.event.detect_by_minors
			? members.filter( ( m: any ) => m.organization !== 'PRIMARIA' ).length
			: totalMembersCount
	);

	const childrenCount = $derived(
		data.event.detect_by_minors
			? members.filter( ( m: any ) => m.organization === 'PRIMARIA' ).length
			: 0
	);

	const activeOrders = $derived( data.orders.filter( ( o ) => o.status !== 'CANCELLED' ) );

	const claimedAdult = $derived.by( () => {
		const claimed: Record<string, number> = {};
		for ( const o of activeOrders ) {
			for ( const item of o.items || [] ) {
				if ( !item.is_minor_portion ) {
					claimed[ item.product_id ] = ( claimed[ item.product_id ] || 0 ) + item.quantity_claimed;
				}
			}
		}
		return claimed;
	} );

	const claimedChild = $derived.by( () => {
		const claimed: Record<string, number> = {};
		for ( const o of activeOrders ) {
			for ( const item of o.items || [] ) {
				if ( item.is_minor_portion ) {
					claimed[ item.product_id ] = ( claimed[ item.product_id ] || 0 ) + item.quantity_claimed;
				}
			}
		}
		return claimed;
	} );

	function translateStatus( status: string ): string {
		const mapping: Record<string, string> = {
			AVAILABLE    : 'Disponible',
			OUT_OF_STOCK : 'Agotado',
			PAUSED       : 'Pausado',
			DISCONTINUED : 'Descontinuado'
		};
		return mapping[ status ] || status;
	}

	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day    : '2-digit',
			month  : 'long',
			year   : 'numeric',
			hour   : '2-digit',
			minute : '2-digit'
		} );
	}

	async function changeStatus( orderId: string, status: string ): Promise<void> {
		const formData = new FormData();
		formData.append( 'orderId', orderId );
		formData.append( 'status', status );

		try {
			const response = await fetch( '?/updateStatus', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidateAll();
			} else {
				alert( ( result as any ).data?.error || 'Error al cambiar estado' );
			}
		} catch ( err: any ) {
			alert( err.message );
		}
	}

	function openDeleteModal( orderId: string ): void {
		orderToDelete   = orderId;
		deleteError     = null;
		deleteModalOpen = true;
	}

	async function confirmDeleteOrder(): Promise<void> {
		if ( !orderToDelete ) return;

		isDeleting  = true;
		deleteError = null;

		const formData = new FormData();
		formData.append( 'orderId', orderToDelete );

		try {
			const response = await fetch( '?/deleteOrder', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidateAll();
				deleteModalOpen = false;
				orderToDelete   = null;
			} else {
				deleteError = ( result as any ).data?.error || 'Error al eliminar la orden';
			}
		} catch ( err: any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}

	async function createManualOrder( e: SubmitEvent ): Promise<void> {
		e.preventDefault();
		isSubmitting = true;
		submitError  = null;

		const form     = e.currentTarget as HTMLFormElement;
		const formData = new FormData( form );

		try {
			const response = await fetch( '?/createOrder', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				form.reset();
				for ( const key of Object.keys( formValues ) ) {
					formValues[ key ] = 0;
				}
				await invalidateAll();
			} else {
				submitError = ( result as any ).data?.error || 'Error al crear la orden';
			}
		} catch ( err: any ) {
			submitError = err.message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Órdenes — { data.familyEvent.family?.family_name || 'Familia' }</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="flex items-center gap-3.5 relative z-10">
			<ButtonBack href="/events/{ data.event.id }" />

			<div class="space-y-0.5">
				<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
					Administración de Órdenes
				</h1>
				<p class="text-xs text-text-secondary">
					Gestiona las raciones y entregas de la familia <span class="font-semibold text-text-primary">{ data.familyEvent.family?.family_name }</span>
				</p>
			</div>
		</div>
	</div>

	{#if isExpired}
		<div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
			<span>⚠️</span>
			<div>
				<p class="font-bold">Este evento ha expirado (Fin Canje: { data.event.expires_at }).</p>
				<p class="text-xs">No se pueden crear, cambiar de estado ni eliminar órdenes para este evento.</p>
			</div>
		</div>
	{/if}

	<!-- Info Grid -->

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="card p-6 space-y-4">
			<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
				<Users size={ 14 } class="text-(--accent)" />
				Información Familiar
			</h2>
			<div class="space-y-2">
				<div>
					<p class="text-xs text-(--text-muted)">Nombre Familia</p>
					<p class="font-semibold text-(--text-primary)">{ data.familyEvent.family?.family_name }</p>
				</div>
				<div>
					<p class="text-xs text-(--text-muted)">Miembros Registrados</p>
					<p class="font-semibold text-(--text-primary)">{ totalMembersCount } ({ adultsCount } Adultos / { childrenCount } Niños)</p>
				</div>
			</div>
		</div>

		<div class="card p-6 space-y-4">
			<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
				<ShoppingBasket size={ 14 } class="text-(--accent)" />
				Detalles del Evento
			</h2>
			<div class="space-y-2">
				<div>
					<p class="text-xs text-(--text-muted)">Evento</p>
					<p class="font-semibold text-(--text-primary)">{ data.event.event_name }</p>
				</div>
				<div>
					<p class="text-xs text-(--text-muted)">Diferencia Menores</p>
					<p class="font-semibold text-(--text-primary)">{ data.event.detect_by_minors ? 'Sí (Organización Primaria)' : 'No (Todos Adultos)' }</p>
				</div>
			</div>
		</div>

		<div class="card p-6 space-y-4">
			<h2 class="text-xs font-bold uppercase tracking-wider text-(--text-muted) flex items-center gap-2">
				<Clock size={ 14 } class="text-(--accent)" />
				Estado de Órdenes
			</h2>
			<div class="space-y-2">
				<div>
					<p class="text-xs text-(--text-muted)">Órdenes Totales</p>
					<p class="font-semibold text-(--text-primary)">{ data.orders.length }</p>
				</div>
				<div>
					<p class="text-xs text-(--text-muted)">Órdenes Activas</p>
					<p class="font-semibold text-(--text-primary)">{ activeOrders.length } ({ activeOrders.filter( ( o ) => o.status === 'COMPLETED' ).length } Completadas / { activeOrders.filter( ( o ) => o.status === 'PENDING' ).length } Pendientes)</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Form & History Section -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
		<!-- Manual Order Form -->
		<div class="card p-6 space-y-6">
			<div class="border-b border-(--border) pb-4">
				<h2 class="text-lg font-bold text-(--text-primary)">Registrar Nueva Orden</h2>
				<p class="text-sm text-(--text-muted)">Ingresa las cantidades de productos a entregar en esta orden.</p>
			</div>

			<form onsubmit={ createManualOrder } class="space-y-6">
				<div class="space-y-4 divide-y divide-(--border)">
					{#each data.eventProducts as ep}
						{@const isAvailable = ep.status === 'AVAILABLE'}
						{@const maxAdultQuota = adultsCount * ep.quantity}
						{@const maxChildQuota = childrenCount * ep.quantity}
						{@const curClaimedAdult = claimedAdult[ ep.product_id ] || 0}
						{@const curClaimedChild = claimedChild[ ep.product_id ] || 0}
						{@const remAdult = maxAdultQuota - curClaimedAdult}
						{@const remChild = maxChildQuota - curClaimedChild}

						<div class="pt-4 first:pt-0 space-y-3">
							<div class="flex items-start justify-between">
								<div>
									<h3 class="font-semibold text-(--text-primary)">{ ep.product?.name }</h3>
									{#if ep.product?.description}
										<p class="text-xs text-(--text-muted) mt-0.5">{ ep.product.description }</p>
									{/if}
								</div>
								{#if !isAvailable}
									<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-400/20 text-red-400 border border-red-400/30">
										{ translateStatus( ep.status ) }
									</span>
								{:else}
									<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-400/20 text-green-400 border border-green-400/30">
										Disponible
									</span>
								{/if}
							</div>

							<!-- Inputs container -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<!-- Adult portions -->
								<div class="space-y-1.5">
									<label for="qty_adult_{ ep.product_id }" class="text-xs text-(--text-muted) font-medium block">
										{ data.event.detect_by_minors ? 'Adulto' : 'Raciones' } (Límite: { remAdult })
									</label>
									<InputNumber
										id="qty_adult_{ ep.product_id }"
										name="qty_adult_{ ep.product_id }"
										min={ 0 }
										max={ remAdult }
										disabled={ !isAvailable || remAdult <= 0 || isExpired }
										bind:value={ formValues[ `qty_adult_${ ep.product_id }` ] }
									/>

									<span class="text-[10px] text-(--text-muted) block mt-1">
										Reclamados: { curClaimedAdult } de { maxAdultQuota }
									</span>
								</div>

								<!-- Child portions -->
								{#if data.event.detect_by_minors}
									<div class="space-y-1.5">
										<label for="qty_child_{ ep.product_id }" class="text-xs text-(--text-muted) font-medium block">
											Niño (Límite: { remChild })
										</label>
										<InputNumber
											id="qty_child_{ ep.product_id }"
											name="qty_child_{ ep.product_id }"
											min={ 0 }
											max={ remChild }
											disabled={ !isAvailable || remChild <= 0 || isExpired }
											bind:value={ formValues[ `qty_child_${ ep.product_id }` ] }
										/>

										<span class="text-[10px] text-(--text-muted) block mt-1">
											Reclamados: { curClaimedChild } de { maxChildQuota }
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if submitError}
					<p class="text-sm text-red-500 font-medium">{ submitError }</p>
				{/if}

				{#if isExpired}
					<div class="p-3 bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl text-xs text-center font-medium">
						Las órdenes están bloqueadas porque el evento ha expirado.
					</div>
				{/if}

				<Button type="submit" variant="primary" class="w-full" loading={ isSubmitting } disabled={ isExpired }>
					<Plus size={ 16 } />
					Registrar Orden
				</Button>

			</form>
		</div>

		<!-- Order History -->
		<div class="space-y-4">
			<div class="card p-6">
				<h2 class="text-lg font-bold text-(--text-primary)">Historial de Órdenes</h2>
				<p class="text-sm text-(--text-muted)">Visualiza y modifica las entregas realizadas.</p>
			</div>

			{#each data.orders as o}
				<div class="card p-6 space-y-4 border-l-4 { o.status === 'COMPLETED' ? 'border-green-500' : o.status === 'PENDING' ? 'border-yellow-500' : 'border-red-500' }">
					<!-- Header order -->
					<div class="flex items-start justify-between gap-3 flex-wrap">
						<div>
							<p class="text-[10px] font-mono text-(--text-muted) uppercase">Orden #{ o.id.slice( 0, 8 ) }</p>
							<p class="text-xs text-(--text-secondary) mt-0.5">{ formatDate( o.created_at ) }</p>
							<p class="text-[11px] text-(--text-muted) mt-1">
								Registrado por: <span class="font-medium text-(--text-secondary)">{ o.scanned_by_user?.full_name ?? 'Administrador' }</span>
							</p>
						</div>

						<div class="flex items-center gap-2">
							<!-- Quick action status -->
							{#if o.status !== 'COMPLETED' && !isExpired}
								<button
									onclick={ () => changeStatus( o.id, 'COMPLETED' ) }
									class="p-1 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors"
									title="Completar / Entregar"
								>
									<Check size={ 14 } />
								</button>
							{/if}

							{#if o.status !== 'PENDING' && !isExpired}
								<button
									onclick={ () => changeStatus( o.id, 'PENDING' ) }
									class="p-1 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
									title="Marcar Pendiente"
								>
									<Clock size={ 14 } />
								</button>
							{/if}

							{#if o.status !== 'CANCELLED' && !isExpired}
								<button
									onclick={ () => changeStatus( o.id, 'CANCELLED' ) }
									class="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
									title="Cancelar Orden"
								>
									<X size={ 14 } />
								</button>
							{/if}

							{#if data.isSuperAdmin && !isExpired}
								<button
									onclick={ () => openDeleteModal( o.id ) }
									class="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors ml-1"
									title="Eliminar Orden"
								>
									<Trash2 size={ 14 } />
								</button>
							{/if}
						</div>

					</div>

					<!-- Items list -->
					<div class="bg-(--bg-surface-2) rounded-xl p-4">
						<ul class="divide-y divide-(--border) space-y-2 first:space-y-0">
							{#each o.items || [] as item}
								<li class="flex justify-between items-center text-sm pt-2 first:pt-0">
									<div>
										<span class="font-medium text-(--text-primary)">{ item.product?.name ?? 'Producto' }</span>
										{#if item.is_minor_portion}
											<span class="ml-1.5 px-1.5 py-0.5 rounded bg-(--t-accent)/10 text-(--t-accent) text-[9px] font-bold uppercase tracking-wider">
												Niño
											</span>
										{/if}
									</div>
									<span class="font-mono font-bold text-(--text-primary)">
										×{ item.quantity_claimed }
									</span>
								</li>
							{:else}
								<p class="text-xs text-(--text-muted) text-center py-2">Sin productos asignados.</p>
							{/each}
						</ul>
					</div>
				</div>
			{:else}
				<div class="card p-12 text-center text-(--text-muted)">
					<ShoppingBasket size={ 40 } class="mx-auto mb-3 opacity-30" />
					<p class="text-sm">No hay órdenes registradas para esta familia.</p>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Modal Delete Order -->
<Modal
	open={ deleteModalOpen }
	onClose={ () => deleteModalOpen = false }
	onConfirm={ confirmDeleteOrder }
	title="Eliminar Orden"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p class="text-sm">¿Estás seguro de que deseas eliminar permanentemente esta orden?</p>
	<p class="mt-2 text-xs text-(--text-muted)">Esta acción removerá los productos reclamados de esta orden y repondrá la cuota familiar.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm font-medium">
			{ deleteError }
		</p>
	{/if}
</Modal>
