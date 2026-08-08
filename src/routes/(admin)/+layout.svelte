<script lang="ts">
	import { page }       from '$app/stores';
	import { goto }       from '$app/navigation';
	import { theme }      from '$lib/stores/theme.svelte.js';
	import { authClient } from '$lib/auth/auth-client.js';
	import { Sun, Moon, Menu as MenuIcon, X } from '@lucide/svelte';
	import Menu           from '$lib/components/shared/Menu.svelte';

	let { children, data } = $props();

	let sidebarOpen = $state( false );

	function toggleSidebar(): void {
		sidebarOpen = !sidebarOpen;
	}

	async function handleLogout(): Promise<void> {
		await authClient.signOut();
		goto( '/login' );
	}

	const currentPath = $derived( $page.url.pathname );
	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/events',    label: 'Eventos' }
	];
</script>

<div class="flex h-screen overflow-hidden bg-(--bg-base)">
	<Menu {sidebarOpen} {toggleSidebar} {handleLogout} {data} />

	<!-- ── Main Content ── -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">

		<!-- Topbar -->
		<header class="glass sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3">
			<button
				onclick={toggleSidebar}
				class="lg:hidden p-2 rounded-lg text-(--text-secondary) hover:bg-(--bg-surface-2) transition-colors"
				aria-label="Abrir menú"
			>
				{#if sidebarOpen}
					<X size={20} />
				{:else}
					<MenuIcon size={20} />
				{/if}
			</button>

			<div class="hidden lg:block">
				<h1 class="text-sm font-medium text-(--text-muted)">
					{navItems.find( ( n ) => currentPath.startsWith( n.href ) )?.label ?? 'FamiPass Admin'}
				</h1>
			</div>

			<!-- Theme toggle -->
			<button
				onclick={() => theme.toggle()}
				class="p-2 rounded-xl text-(--text-secondary) hover:text-(--accent) hover:bg-(--accent-muted) transition-all duration-200 ml-auto"
				aria-label={theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
			>
				{#if theme.isDark}
					<Sun size={20} />
				{:else}
					<Moon size={20} />
				{/if}
			</button>
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
