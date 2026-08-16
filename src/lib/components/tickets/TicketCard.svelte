<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCodeStyling          from 'qr-code-styling';
	import { theme }              from '$lib/stores/theme.svelte.js';
	import type { FamilyEvent, Order } from '$lib/types/index.js';
	import { Crown, User as UserIcon, Users, ShoppingBasket, Trash2 } from '@lucide/svelte';
	import Modal                  from '$lib/components/ui/Modal.svelte';
	import { deserialize }        from '$app/forms';
	import { invalidate }         from '$app/navigation';

	interface Props {
		familyEvent : FamilyEvent & { orders?: Order[] };
		order?      : Order | null;
		staffUrl    : string;
	}

	let { familyEvent, order = null, staffUrl }: Props = $props();

	let qrContainer     = $state<HTMLDivElement | null>( null );
	let qrInstance      : QRCodeStyling | null = null;
	let deleteModalOpen = $state( false );
	let isDeleting      = $state( false );
	let deleteError     = $state<string | null>( null );

	const ordersTaken = $derived( familyEvent.orders?.length ?? 0 );
	const maxOrders   = $derived( familyEvent.family?.members?.length ?? 0 );

	const qrUrl = $derived(
		familyEvent.qr_code_hash
			? `${ staffUrl }/scan/${ familyEvent.qr_code_hash }`
			: null
	);

	const accentColor = $derived( theme.isDark ? '#F59E0B' : '#00B4D8' );

	async function confirmDelete(): Promise<void> {
		isDeleting  = true;
		deleteError = null;

		const formData = new FormData();
		formData.append( 'familyEventId', familyEvent.id );

		try {
			const response = await fetch( '?/removeFamily', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:event' );
				deleteModalOpen = false;
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error || 'Error al eliminar la familia del evento';
			} else {
				deleteError = 'Ocurrió un error inesperado';
			}
		} catch ( err: any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}

	const members = $derived( () => {
		if ( order?.family_members && order.family_members.length > 0 ) {
			return order.family_members;
		}
		return familyEvent.family?.members?.map( ( m ) => ( {
			rut              : m.rut,
			full_name        : m.full_name,
			organization     : m.organization,
			is_representative: m.is_representative,
		} ) ) ?? [];
	} );

	function formatDate( d: string ): string {
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day  : 'numeric',
			month: 'long',
			year : 'numeric',
		} );
	}

	function buildQR(): void {
		if ( !qrUrl || !qrContainer ) return;

		qrContainer.innerHTML = '';

		qrInstance = new QRCodeStyling( {
			width         : 180,
			height        : 180,
			type          : 'svg',
			data          : qrUrl,
			dotsOptions   : { color: accentColor, type: 'rounded' },
			cornersSquareOptions: { type: 'extra-rounded', color: accentColor },
			cornersDotOptions   : { type: 'dot',           color: accentColor },
			backgroundOptions   : { color: 'transparent' },
			imageOptions        : { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
			qrOptions           : { errorCorrectionLevel: 'M' },
		} );

		qrInstance.append( qrContainer );
	}

	onMount( () => {
		buildQR();
	} );

	onDestroy( () => {
		qrInstance = null;
	} );

	$effect( () => {
		// Reactive to theme/url changes
		const _dep1 = accentColor;
		const _dep2 = qrUrl;
		buildQR();
	} );
</script>

<!-- ── TicketCard ── -->
<article
	class="relative flex flex-col w-full max-w-sm rounded-2xl overflow-hidden
	       border border-(--border) bg-(--bg-surface)
	       shadow-(--shadow-md) hover:shadow-(--shadow-lg)
	       hover:-translate-y-1 transition-all duration-300 cursor-default"
>

	<!-- Header strip -->
	<div class="px-5 pt-5 pb-4 bg-gradient-to-br from-(--accent) to-(--accent-hover)">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
					{familyEvent.event?.event_name ?? 'Evento'}
				</p>
				<h3 class="text-lg font-bold text-white truncate">
					{familyEvent.family?.family_name ?? 'Familia'}
				</h3>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				{#if order}
					<span class="px-2.5 py-1 rounded-full text-xs font-bold
					             {order.status === 'COMPLETED'
					                 ? 'bg-green-400/20 text-green-100'
					                 : order.status === 'PENDING'
					                     ? 'bg-yellow-400/20 text-yellow-100'
					                     : 'bg-red-400/20 text-red-100'}">
						{order.status === 'COMPLETED' ? 'Completada' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
					</span>
				{/if}

				<button
					type="button"
					onclick={ () => deleteModalOpen = true }
					disabled={ ordersTaken > 0 }
					class="p-1.5 rounded-lg text-white/80 hover:text-red-200 hover:bg-white/10 disabled:opacity-40 disabled:hover:text-white/80 disabled:hover:bg-transparent transition-colors"
					title={ ordersTaken > 0 ? 'No se puede eliminar la familia porque ya tiene órdenes registradas' : 'Eliminar familia del evento' }
				>
					<Trash2 size={ 16 } />
				</button>
			</div>
		</div>
		{#if familyEvent.event?.event_date}
			<div class="flex items-center justify-between mt-2">
				<p class="text-white/80 text-xs">{ formatDate( familyEvent.event.event_date ) }</p>
				<span class="text-white/90 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-md">
					Órdenes: { ordersTaken } / { maxOrders }
				</span>
			</div>
		{:else}
			<div class="flex justify-end mt-2">
				<span class="text-white/90 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-md">
					Órdenes: { ordersTaken } / { maxOrders }
				</span>
			</div>
		{/if}
	</div>

	<!-- Tear line -->
	<div class="flex items-center px-4 -my-px z-10">
		<div class="w-4 h-4 rounded-full bg-(--bg-base) border border-(--border) flex-shrink-0 -ml-6"></div>
		<div class="flex-1 border-t-2 border-dashed border-(--border) mx-2"></div>
		<div class="w-4 h-4 rounded-full bg-(--bg-base) border border-(--border) flex-shrink-0 -mr-6"></div>
	</div>

	<!-- Body -->
	<div class="px-5 pt-4 pb-2 flex-1 space-y-4">

		<!-- Members -->
		{#if members().length > 0}
			<div>
				<div class="flex items-center gap-1.5 mb-2">
					<Users size={14} class="text-(--accent)" />
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
						Miembros ({members().length})
					</p>
				</div>
				<ul class="space-y-1.5">
					{#each members() as member}
						<li class="flex items-center gap-2">
							{#if member.is_representative}
								<Crown size={13} class="text-(--accent) flex-shrink-0" />
							{:else}
								<UserIcon size={13} class="text-(--text-muted) flex-shrink-0" />
							{/if}
							<span class="text-sm text-(--text-primary) font-medium truncate">
								{member.full_name}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Order items -->
		{#if order?.items && order.items.length > 0}
			<div>
				<div class="flex items-center gap-1.5 mb-2">
					<ShoppingBasket size={14} class="text-(--accent)" />
					<p class="text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
						Productos reclamados
					</p>
				</div>
				<ul class="space-y-1">
					{#each order.items as item}
						<li class="flex justify-between text-sm">
							<span class="text-(--text-primary) truncate">{item.product?.name ?? item.product_id}</span>
							<span class="text-(--text-muted) flex-shrink-0 ml-2">×{item.quantity_claimed}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<!-- Tear line 2 -->
	<div class="flex items-center px-4 -my-px z-10">
		<div class="w-4 h-4 rounded-full bg-(--bg-base) border border-(--border) flex-shrink-0 -ml-6"></div>
		<div class="flex-1 border-t-2 border-dashed border-(--border) mx-2"></div>
		<div class="w-4 h-4 rounded-full bg-(--bg-base) border border-(--border) flex-shrink-0 -mr-6"></div>
	</div>

	<!-- QR Footer -->
	<div class="px-5 py-5 flex flex-col items-center">
		{#if qrUrl}
			<div
				bind:this={qrContainer}
				class="w-[180px] h-[180px] flex items-center justify-center"
				aria-label="Código QR del ticket"
			></div>
			<p class="text-xs text-(--text-muted) mt-2 font-mono break-all text-center">
				{familyEvent.qr_code_hash}
			</p>
		{:else}
			<div class="w-[180px] h-[180px] flex flex-col items-center justify-center
			            border-2 border-dashed border-(--border) rounded-xl">
				<p class="text-xs text-(--text-muted) text-center px-4">
					QR generado al crear el grupo familiar
				</p>
			</div>
		{/if}
	</div>

</article>

<Modal
	open={ deleteModalOpen }
	onClose={ () => deleteModalOpen = false }
	onConfirm={ confirmDelete }
	title="Desasociar Familia"
	confirmLabel="Desasociar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p class="text-sm">¿Estás seguro de que deseas desasociar a la familia <strong class="text-(--text-primary)">"{ familyEvent.family?.family_name }"</strong> de este evento?</p>
	<p class="mt-2 text-xs text-(--text-muted)">Esta acción eliminará el ticket familiar y su código QR. No se puede deshacer.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm font-medium">{ deleteError }</p>
	{/if}
</Modal>

