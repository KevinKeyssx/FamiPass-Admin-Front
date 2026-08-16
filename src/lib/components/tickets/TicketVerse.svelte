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

	const accentColor = $derived( theme.isDark ? '#a5b4fc' : '#7c3aed' );

	const statusColor = $derived(
		order
			? order.status === 'COMPLETED'
				? '#10B981'
				: order.status === 'PENDING'
					? '#F59E0B'
					: '#EF4444'
			: 'var(--t-accent)'
	);

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
				deleteError = ( result.data as any )?.error || 'Error al desasociar la familia del evento';
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

	const representativeName = $derived(
		members().find( ( m ) => m.is_representative )?.full_name || 'No asignado'
	);

	function formatDate( d: string ): string {
		if ( !d ) return '—';
		return new Date( d ).toLocaleDateString( 'es-CL', {
			day   : 'numeric',
			month : 'short',
			year  : 'numeric',
		} );
	}

	function buildQR(): void {
		if ( !qrUrl || !qrContainer ) return;

		qrContainer.innerHTML = '';

		qrInstance = new QRCodeStyling( {
			width                : 90,
			height               : 90,
			type                 : 'svg',
			data                 : qrUrl,
			dotsOptions          : { color: accentColor, type: 'rounded' },
			cornersSquareOptions : { type: 'extra-rounded', color: accentColor },
			cornersDotOptions    : { type: 'dot',           color: accentColor },
			backgroundOptions    : { color: 'transparent' },
			imageOptions         : { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
			qrOptions            : { errorCorrectionLevel: 'M' },
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
		const _dep1 = accentColor;
		const _dep2 = qrUrl;
		buildQR();
	} );
</script>

<div class="ticket-wrapper">
	<div class="ticket">
		<div class="t-main">
			<div class="t-content">
				<div class="t-header">
					<div class="t-logo">
						<svg viewBox="0 0 24 24">
							<path
								d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							></path>
						</svg>
						FamiPass
					</div>
					<div class="flex items-center gap-2 shrink-0">
						<div class="t-type" style="color: { statusColor }; border-color: { statusColor }">
							{ order ? ( order.status === 'COMPLETED' ? 'Reclamado' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelado' ) : 'Sin Orden' }
						</div>
						<button
							type="button"
							onclick={ () => deleteModalOpen = true }
							disabled={ ordersTaken > 0 }
							class="p-1 rounded-md text-white/60 hover:text-red-400 hover:bg-white/5 disabled:opacity-30 disabled:hover:text-white/60 disabled:hover:bg-transparent transition-colors shrink-0"
							title={ ordersTaken > 0 ? 'No se puede eliminar la familia porque ya tiene órdenes' : 'Eliminar familia del evento' }
						>
							<Trash2 size={ 14 } />
						</button>
					</div>
				</div>

				<div class="t-title truncate" title={ familyEvent.family?.family_name }>
					{ familyEvent.family?.family_name ?? 'FAMILIA' }
				</div>
				<div class="t-subtitle truncate" title={ familyEvent.event?.event_name }>
					{ familyEvent.event?.event_name ?? 'Evento FamiPass' }
				</div>

				<div class="t-details">
					<div class="t-detail-item">
						<span class="t-label">Representante</span>
						<span class="t-value truncate" style="max-width: 90px;" title={ representativeName }>
							{ representativeName }
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Fecha</span>
						<span class="t-value">
							{ formatDate( familyEvent.created_at || '' ) }
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Estado</span>
						<span class="t-value" style="color: { statusColor }">
							{ order ? ( order.status === 'COMPLETED' ? 'Reclamado' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelado' ) : 'No Reclamado' }
						</span>
					</div>
					<div class="t-detail-item">
						<span class="t-label">Miembros</span>
						<span class="t-value">
							{ members().length }
						</span>
					</div>
				</div>

				<!-- Lists: Members & Claimed Products -->
				<div class="t-lists-section mt-4 pt-3 border-t border-white/10 space-y-4">
					{#if members().length > 0}
						<div class="space-y-1.5">
							<div class="flex items-center gap-1.5 opacity-60">
								<Users size={ 12 } class="text-[var(--t-accent)]" />
								<span class="text-[9px] font-bold uppercase tracking-wider text-[var(--t-text-muted)]">Miembros familiares</span>
							</div>
							<ul class="space-y-1 max-h-24 overflow-y-auto pr-1">
								{#each members() as member}
									<li class="flex items-center gap-1.5 text-xs text-white/95">
										{#if member.is_representative}
											<Crown size={ 11 } class="text-[var(--t-accent)] shrink-0" />
										{:else}
											<UserIcon size={ 11 } class="text-white/40 shrink-0" />
										{/if}
										<span class="truncate" title={ member.full_name }>
											{ member.full_name }
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if order?.items && order.items.length > 0}
						<div class="space-y-1.5">
							<div class="flex items-center gap-1.5 opacity-60">
								<ShoppingBasket size={ 12 } class="text-[var(--t-accent)]" />
								<span class="text-[9px] font-bold uppercase tracking-wider text-[var(--t-text-muted)]">Productos reclamados</span>
							</div>
							<ul class="space-y-1 max-h-24 overflow-y-auto pr-1">
								{#each order.items as item}
									<li class="flex justify-between text-xs text-white/95">
										<span class="truncate" title={ item.product?.name ?? item.product_id }>
											{ item.product?.name ?? item.product_id }
										</span>
										<span class="text-white/40 ml-2 font-mono text-[11px]">
											×{ item.quantity_claimed }
										</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
			<div
				class="t-perforation"
				style="position:absolute; bottom:0; left:0; width:100%; transform:translateY(50%);"
			>
				<div class="t-perf-line"></div>
			</div>
		</div>
		<div class="t-stub">
			<div class="t-qr-container">
				{#if qrUrl}
					<a href="/events/{ familyEvent.event_id }/orders/{ familyEvent.id }" class="t-qr-link">
						<div bind:this={ qrContainer } class="t-qr-code"></div>
						<div class="t-qr-id">
							{ familyEvent.qr_code_hash }
						</div>
					</a>
				{:else}
					<div class="t-qr-code border border-dashed border-white/20 rounded-lg flex items-center justify-center">
						<span class="text-[8px] text-white/30 text-center px-1">Sin QR</span>
					</div>
				{/if}
			</div>
			<div class="t-admit">
				<div class="t-admit-text">Órdenes</div>
				<div class="t-admit-num">
					{ ordersTaken }/{ maxOrders }
				</div>
			</div>
		</div>
	</div>
</div>

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
		<p class="mt-3 text-red-500 text-sm font-medium">
			{ deleteError }
		</p>
	{/if}
</Modal>

<style>
	/* From Uiverse.io by zeeshan_2112 */ 
	.ticket-wrapper {
		--t-bg         : #1e1e24;
		--t-bg-light   : #2b2b36;
		--t-accent     : #7c3aed;
		--t-accent-glow: rgba( 124, 58, 237, 0.5 );
		--t-text-main  : #f8fafc;
		--t-text-muted : #94a3b8;
		font-size: 11px;
		perspective: 1000px;
		display: inline-block;
	}

	.ticket {
		position: relative;
		width: 24em;
		color: var( --t-text-main );
		font-family: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
		transform-style: preserve-3d;
		transition:
			transform 0.6s cubic-bezier( 0.23, 1, 0.32, 1 ),
			box-shadow 0.6s ease;
		box-shadow:
			0 20px 40px rgba( 0, 0, 0, 0.8 ),
			0 0 0 1px rgba( 255, 255, 255, 0.05 );
		background: transparent;
		filter: drop-shadow( 0px 0px 10px rgba( 0, 0, 0, 0.5 ) );
	}

	.ticket-wrapper:hover .ticket {
		transform: rotateX( 5deg ) rotateY( -10deg ) scale( 1.02 );
		box-shadow:
			20px 20px 40px rgba( 0, 0, 0, 0.6 ),
			0 0 0 1px rgba( 255, 255, 255, 0.1 ),
			-5px -5px 20px var( --t-accent-glow );
	}

	.ticket::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: 1em;
		pointer-events: none;
		background: linear-gradient(
			115deg,
			transparent 0%,
			transparent 40%,
			rgba( 255, 255, 255, 0.1 ) 45%,
			rgba( 255, 255, 255, 0.3 ) 50%,
			rgba( 255, 255, 255, 0.1 ) 55%,
			transparent 60%,
			transparent 100%
		);
		z-index: 10;
		background-size: 250% 250%;
		background-position: 100% 100%;
		transition: background-position 0.6s cubic-bezier( 0.23, 1, 0.32, 1 );
		mix-blend-mode: overlay;
	}

	.ticket-wrapper:hover .ticket::after {
		background-position: 0% 0%;
	}

	.t-main {
		padding: 2em;
		position: relative;
		overflow: hidden;
		background: radial-gradient(
			circle at bottom left,
			transparent 1em,
			var( --t-bg ) 1.05em
		),
		radial-gradient( circle at bottom right, transparent 1em, var( --t-bg ) 1.05em );
		background-size: 51% 100%;
		background-position:
			bottom left,
			bottom right;
		background-repeat: no-repeat;
		border-top-left-radius: 1em;
		border-top-right-radius: 1em;
	}

	.t-main::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: linear-gradient(
			rgba( 124, 58, 237, 0.15 ) 1px,
			transparent 1px
		),
		linear-gradient( 90deg, rgba( 124, 58, 237, 0.15 ) 1px, transparent 1px );
		background-size: 2em 2em;
		opacity: 0.6;
		z-index: 0;
		pointer-events: none;
		transform: perspective( 500px ) rotateX( 20deg ) scale( 1.5 );
		animation: grid-scroll 20s linear infinite;
	}

	@keyframes grid-scroll {
		0% {
			background-position: 0 0;
		}
		100% {
			background-position: 0 4em;
		}
	}

	.t-content {
		position: relative;
		z-index: 1;
	}

	.t-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2em;
	}

	.t-logo {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 900;
		font-size: 1.2em;
		letter-spacing: -0.05em;
		color: #fff;
	}

	.t-logo svg {
		width: 1.5em;
		height: 1.5em;
		fill: var( --t-accent );
		filter: drop-shadow( 0 0 5px var( --t-accent ) );
		animation: logo-pulse 3s ease-in-out infinite alternate;
	}

	@keyframes logo-pulse {
		0% {
			filter: drop-shadow( 0 0 2px var( --t-accent ) );
		}
		100% {
			filter: drop-shadow( 0 0 10px var( --t-accent ) ) brightness( 1.2 );
		}
	}

	.t-type {
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var( --t-accent );
		border: 1px solid var( --t-accent );
		padding: 0.3em 0.8em;
		border-radius: 99em;
		font-weight: 700;
	}

	.t-title {
		font-size: 2.5em;
		font-weight: 900;
		line-height: 1.1;
		margin-bottom: 0.2em;
		text-transform: uppercase;
		background: linear-gradient( 135deg, #fff 0%, #a5b4fc 100% );
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.t-subtitle {
		color: var( --t-text-muted );
		font-size: 0.9em;
		margin-bottom: 2.5em;
	}

	.t-details {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5em;
		margin-bottom: 1em;
	}

	.t-detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.t-label {
		font-size: 0.9em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var( --t-text-muted );
		font-weight: 600;
	}

	.t-value {
		font-size: 1.25em;
		font-weight: 700;
		color: var( --t-text-main );
	}

	.t-perforation {
		display: flex;
		justify-content: space-between;
		height: 1em;
		align-items: center;
		position: relative;
		z-index: 2;
	}

	.t-perf-line {
		flex-grow: 1;
		height: 0;
		border-top: 2px dashed rgba( 255, 255, 255, 0.2 );
		margin: 0 1.5em;
	}

	.t-stub {
		padding: 2em;
		background: radial-gradient(
			circle at top left,
			transparent 1em,
			var( --t-bg-light ) 1.05em
		),
		radial-gradient( circle at top right, transparent 1em, var( --t-bg-light ) 1.05em );
		background-size: 51% 100%;
		background-position:
			top left,
			top right;
		background-repeat: no-repeat;
		border-bottom-left-radius: 1em;
		border-bottom-right-radius: 1em;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
	}

	.t-qr-container {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-items: center;
	}

	.t-qr-link {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-items: center;
		text-decoration: none;
		transition: transform 0.2s ease, filter 0.2s ease;
	}

	.t-qr-link:hover {
		transform: scale( 1.05 );
		filter: drop-shadow( 0 0 8px var( --t-accent-glow ) );
	}

	.t-qr-code {
		width: 90px;
		height: 90px;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.t-qr-id {
		font-family: monospace;
		font-size: 0.7em;
		color: var( --t-text-muted );
		letter-spacing: 0.1em;
		text-align: center;
		max-width: 140px;
		word-break: break-all;
	}

	.t-admit {
		text-align: right;
	}

	.t-admit-text {
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var( --t-text-muted );
	}

	.t-admit-num {
		font-size: 3em;
		font-weight: 900;
		line-height: 1;
		color: var( --t-accent );
		text-shadow: 0 0 15px var( --t-accent-glow );
	}

	.ticket-wrapper:active .ticket {
		transform: rotateX( 15deg ) rotateY( -5deg ) scale( 0.98 );
	}

	.ticket-wrapper:active .t-stub {
		transform: translateY( 5px ) rotateZ( 2deg );
		opacity: 0.8;
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
	}

	.t-lists-section ul::-webkit-scrollbar {
		width: 4px;
	}
	.t-lists-section ul::-webkit-scrollbar-track {
		background: transparent;
	}
	.t-lists-section ul::-webkit-scrollbar-thumb {
		background: rgba( 255, 255, 255, 0.1 );
		border-radius: 99px;
	}
	.t-lists-section ul::-webkit-scrollbar-thumb:hover {
		background: rgba( 255, 255, 255, 0.2 );
	}
</style>