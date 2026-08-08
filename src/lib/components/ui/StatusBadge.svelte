<script lang="ts">
	import Badge from './Badge.svelte';
	import type { EventStatus, OrderStatus } from '$lib/types/index.js';

	interface Props {
		status: EventStatus | OrderStatus;
		class? : string;
	}

	let { status, class: extraClass = '' }: Props = $props();

	const labelMap: Record<EventStatus | OrderStatus, string> = {
		DRAFT      : 'Borrador',
		IN_PROGRESS: 'En Curso',
		FINISHED   : 'Finalizado',
		CANCELLED  : 'Cancelado',
		PENDING    : 'Pendiente',
		COMPLETED  : 'Completado',
	};

	const classMap: Record<EventStatus | OrderStatus, string> = {
		DRAFT      : 'status-draft',
		IN_PROGRESS: 'status-in-progress',
		FINISHED   : 'status-finished',
		CANCELLED  : 'status-cancelled',
		PENDING    : 'status-pending',
		COMPLETED  : 'status-completed',
	};
</script>

<span class="{classMap[ status ]} {extraClass}">
	<Badge>{labelMap[ status ]}</Badge>
</span>
