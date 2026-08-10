<script lang="ts">
	import type { EventStatus } from '$lib/types/index.js';
	import StatusBadge          from '$lib/components/ui/StatusBadge.svelte';

	interface Props {
		status : EventStatus;
	}

	let { status }: Props = $props();
</script>

<StatusBadge status={ status } />
