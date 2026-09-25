<script lang="ts">
	import { onMount, onDestroy }   from 'svelte';
	import { deserialize }          from '$app/forms';
	import { invalidate }           from '$app/navigation';
	import QRCodeStyling            from 'qr-code-styling';
	import {
		Trash2,
		Download,
		Calendar,
		ShoppingBasket,
		Ticket,
		Clock
	}                               from '@lucide/svelte';

	import type { FamilyEvent }     from '$lib/types/index.js';
	import { theme }                from '$lib/stores/theme.svelte.js';
	import { PUBLIC_STAFF_URL }     from '$env/static/public';
	import { formatEventDate }      from '$lib/utils/date.js';
	import Modal                    from '$lib/components/ui/Modal.svelte';


	interface Props {
		familyEvent : FamilyEvent;
		onDeleted?  : () => void;
	}

	let { familyEvent, onDeleted } : Props = $props();

	let qrInstance      : QRCodeStyling | null = null;
	let qrContainer     = $state<HTMLDivElement | null>( null );
	let deleteModalOpen = $state( false );
	let isDeleting      = $state( false );
	let deleteError     = $state<string | null>( null );

	const ordersTaken = $derived( familyEvent.orders?.length ?? 0 );
	const maxOrders   = $derived( familyEvent.family?.members?.length ?? 0 );
	const accentColor = $derived( theme.isDark ? '#F59E0B' : '#00B4D8' );
	const qrUrl       = $derived(
		familyEvent.qr_code_hash
			? `${ PUBLIC_STAFF_URL }/scan/${ familyEvent.qr_code_hash }`
			: null
	);


	function buildQR() : void {
		if ( !qrUrl || !qrContainer ) return;

		qrContainer.innerHTML = '';

		qrInstance = new QRCodeStyling({
			width                : 160,
			height               : 160,
			type                 : 'svg',
			data                 : qrUrl,
			dotsOptions          : { color : accentColor, type : 'rounded' },
			cornersSquareOptions : { type : 'extra-rounded', color : accentColor },
			cornersDotOptions    : { type : 'dot', color : accentColor },
			backgroundOptions    : { color : 'transparent' },
			imageOptions         : { hideBackgroundDots : true, imageSize : 0.3, margin : 4 },
			qrOptions            : { errorCorrectionLevel : 'M' }
		});

		qrInstance.append( qrContainer );
	}

	function downloadQR() : void {
		if ( !qrInstance ) return;

		const famName = familyEvent.family?.family_name || 'familia';
		const evName  = familyEvent.event?.event_name || 'evento';

		qrInstance.download({
			name      : `ticket-${ evName }-${ famName }`,
			extension : 'png'
		});
	}

	async function confirmDelete() : Promise<void> {
		isDeleting  = true;
		deleteError = null;

		const formData = new FormData();
		formData.append( 'familyEventId', familyEvent.id );

		try {
			const response = await fetch( '?/removeTicket', {
				method : 'POST',
				body   : formData
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:family' );
				deleteModalOpen = false;
				onDeleted?.();
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error || 'Error al eliminar el ticket de la familia.';
			} else {
				deleteError = 'Ocurrió un error inesperado al desvincular el ticket.';
			}
		} catch ( err : any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}

	onMount( () => {
		buildQR();
	} );

	onDestroy( () => {
		qrInstance = null;
	} );

	$effect( () => {
		buildQR();
	} );
</script>

<article class="relative flex flex-col w-full rounded-2xl overflow-hidden border border-border bg-bg-surface-2/40 shadow-sm hover:shadow-md transition-all duration-300">
	<!-- Encabezado con información del evento -->
	<div class="p-4 bg-linear-to-r from-bg-surface-2 to-bg-surface border-b border-border/80 flex items-start justify-between gap-3">
		<div class="min-w-0 space-y-1">
			<div class="flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider">
				<Ticket size={ 14 } class="shrink-0" />
				<span class="truncate">{ familyEvent.event?.event_name ?? 'Evento Asignado' }</span>
			</div>

			{#if familyEvent.event?.event_date}
				<div class="flex items-center gap-1.5 text-xs text-text-secondary">
					<Calendar size={ 12 } class="shrink-0 text-text-muted" />
					<span>{ formatEventDate( familyEvent.event.event_date ) }</span>
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-1.5 shrink-0">
			<button
				type="button"
				onclick={ downloadQR }
				title="Descargar código QR"
				class="p-2 rounded-xl text-text-muted hover:text-accent hover:bg-accent-muted/20 border border-border/60 transition-colors cursor-pointer"
			>
				<Download size={ 14 } />
			</button>

			<button
				type="button"
				onclick={ () => { deleteModalOpen = true; } }
				disabled={ ordersTaken > 0 }
				title={ ordersTaken > 0 ? 'No se puede desvincular: ya tiene órdenes registradas' : 'Desvincular ticket de este evento' }
				class="p-2 rounded-xl text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-border/60 disabled:opacity-40 disabled:hover:text-text-muted disabled:hover:bg-transparent transition-colors cursor-pointer"
			>
				<Trash2 size={ 14 } />
			</button>
		</div>
	</div>

	<!-- Contenido del ticket con QR -->
	<div class="p-5 flex flex-col items-center justify-center space-y-3">
		<div class="p-3 rounded-2xl bg-white shadow-xs border border-border/40 inline-flex items-center justify-center">
			<div bind:this={ qrContainer } class="w-40 h-40 flex items-center justify-center"></div>
		</div>

		<div class="w-full flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/40 px-1">
			<div class="flex items-center gap-1.5">
				<ShoppingBasket size={ 13 } class="text-accent shrink-0" />
				<span>Órdenes: <strong class="text-text-primary">{ ordersTaken }</strong> / { maxOrders }</span>
			</div>

			{#if familyEvent.short_code}
				<span class="font-mono text-[11px] px-2 py-0.5 rounded-md bg-bg-surface border border-border text-text-muted">
					#{ familyEvent.short_code }
				</span>
			{/if}
		</div>
	</div>
</article>

<!-- Modal de Confirmación para Desvincular Ticket -->
<Modal
	open           = { deleteModalOpen }
	onClose        = { () => { deleteModalOpen = false; } }
	onConfirm      = { confirmDelete }
	title          = "Desvincular Ticket del Evento"
	confirmLabel   = "Desvincular"
	confirmVariant = "danger"
	loading        = { isDeleting }
>
	<p>¿Estás seguro de que deseas desvincular este ticket del evento <strong class="text-text-primary">"{ familyEvent.event?.event_name }"</strong>?</p>
	<p class="mt-2 text-xs text-text-secondary">El código QR actual quedará invalidado y la familia ya no podrá ingresar con este ticket.</p>

	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
