<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCodeStyling          from 'qr-code-styling';
	import { theme }              from '$lib/stores/theme.svelte.js';
	import type { FamilyEvent, Order } from '$lib/types/index.js';
	import { Crown, User as UserIcon, Users, ShoppingBasket } from '@lucide/svelte';

	interface Props {
		familyEvent : FamilyEvent;
		order?      : Order | null;
		staffUrl    : string;
	}

	let { familyEvent, order = null, staffUrl }: Props = $props();

	let qrContainer = $state<HTMLDivElement | null>( null );
	let qrInstance  : QRCodeStyling | null = null;

	const qrUrl = $derived(
		familyEvent.qr_code_hash
			? `${ staffUrl }/scan/${ familyEvent.qr_code_hash }`
			: null
	);

	const accentColor = $derived( theme.isDark ? '#F59E0B' : '#00B4D8' );

	const members = $derived( () => {
		if ( order?.family_members && order.family_members.length > 0 ) {
			return order.family_members;
		}
		return familyEvent.family?.members?.map( ( m ) => ( {
			rut              : m.rut,
			full_name        : m.full_name,
			relationship     : m.relationship ?? 'OTRO',
			organization     : m.organization,
			is_representative: m.is_representative,
		} ) ) ?? [];
	} );

	const relationshipLabel: Record<string, string> = {
		PADRE   : 'Padre',
		MADRE   : 'Madre',
		HIJO    : 'Hijo/a',
		HERMANO : 'Hermano/a',
		ABUELO  : 'Abuelo/a',
		CONYUGE : 'Cónyuge',
		NIETO   : 'Nieto/a',
		TIO     : 'Tío/a',
		INVITADO: 'Invitado/a',
		OTRO    : 'Otro',
	};

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
			{#if order}
				<span class="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold
				             {order.status === 'COMPLETED'
				                 ? 'bg-green-400/20 text-green-100'
				                 : order.status === 'PENDING'
				                     ? 'bg-yellow-400/20 text-yellow-100'
				                     : 'bg-red-400/20 text-red-100'}">
					{order.status === 'COMPLETED' ? 'Completada' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
				</span>
			{/if}
		</div>
		{#if familyEvent.event?.event_date}
			<p class="text-white/80 text-xs mt-2">{formatDate( familyEvent.event.event_date )}</p>
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
							<span class="text-xs text-(--text-muted) flex-shrink-0">
								{relationshipLabel[ member.relationship ] ?? member.relationship}
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

