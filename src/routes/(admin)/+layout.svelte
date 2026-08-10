<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import { Menu as MenuIcon, X } from '@lucide/svelte';

	import { authClient }   from '$lib/auth/auth-client.js';
	import Menu             from '$lib/components/shared/Menu.svelte';
    import ToggleTheme      from '$lib/components/shared/ToggleTheme.svelte';


    let { children, data } = $props();


    let sidebarOpen = $state( false );


    function toggleSidebar(): void {
		sidebarOpen = !sidebarOpen;
	}


    async function handleLogout(): Promise<void> {
		await authClient.signOut();
		goto( '/login' );
	}


    const currentPath = $derived( page.url.pathname );


    const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/events',    label: 'Eventos' }
	];
</script>

<div class="flex h-screen overflow-hidden bg-(--bg-base) relative">
	<!-- Background Ambient Glow & Grid Pattern -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
		<!-- SVG Grid Pattern -->
		<svg class="absolute inset-0 w-full h-full stroke-(--border)/10 mask-[radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
			<defs>
				<pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse" x="-1" y="-1">
					<path d="M.5 40V.5H40" fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid-pattern)" />
		</svg>

		<!-- Animated Glow Aura 1 (Top Right) -->
		<div class="absolute top-[-40%] right-[-20%] w-[80%] h-[80%] rounded-full bg-(--accent)/15 blur-[120px] animate-glow-slow"></div>

		<!-- Animated Glow Aura 2 (Bottom Left) -->
		<div class="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 dark:bg-indigo-500/5 blur-[100px] animate-glow-medium"></div>

		<!-- Animated Glow Aura 3 (Bottom Left - Accent Overlay) -->
		<div class="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] rounded-full bg-(--accent)/10 blur-[110px] animate-glow-fast"></div>
	</div>

	<Menu {sidebarOpen} {toggleSidebar} {handleLogout} {data} />

	<!-- ── Main Content ── -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
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
			<ToggleTheme />
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
