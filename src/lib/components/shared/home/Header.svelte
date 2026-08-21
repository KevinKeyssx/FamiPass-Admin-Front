<script lang="ts">
	import { Menu as MenuIcon, X } from '@lucide/svelte';
	import ToggleTheme from '../ToggleTheme.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';

	interface Props {
		sidebarOpen   : boolean;
		toggleSidebar : () => void;
	}

	let { sidebarOpen, toggleSidebar }: Props = $props();
</script>

<header class="glass sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 select-none">
	<div class="flex items-center gap-3">
		<!-- Sidebar Toggle for Mobile -->
		<button
			onclick={ toggleSidebar }
			class="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-bg-surface-2 transition-colors shrink-0"
			aria-label="Abrir menú"
		>
			{#if sidebarOpen}
				<X size={ 20 } />
			{:else}
				<MenuIcon size={ 20 } />
			{/if}
		</button>

		<!-- Breadcrumbs Navigation -->
		<Breadcrumbs />
	</div>

	<!-- Theme toggle -->
	<ToggleTheme />
</header>
