<script lang="ts">
	import { page }  from '$app/state';

    import {  LogOut, LayoutDashboard, CalendarDays, Package } from '@lucide/svelte';

    import ToggleTheme from './ToggleTheme.svelte';


    interface Props {
		sidebarOpen   : boolean;
		toggleSidebar : () => void;
		handleLogout  : () => Promise<void>;
		data          : {
			user : {
				name?  : string | null;
				email? : string | null;
			} | null;
		} | null;
	}


    let { sidebarOpen, toggleSidebar, handleLogout, data } : Props = $props();


    const navItems = [
		{ href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
		{ href: '/events',    label: 'Eventos',   Icon: CalendarDays },
		{ href: '/products',  label: 'Productos', Icon: Package }
	];


    const currentPath = $derived( page.url.pathname );
</script>

<!-- ── Sidebar Overlay (mobile) ── -->
{#if sidebarOpen}
	<div
		class       = "fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
		role        = "button"
		tabindex    = "-1"
		aria-label  = "Cerrar menú"
		onclick     = { toggleSidebar }
		onkeydown   = { ( e ) => e.key === 'Enter' && toggleSidebar() }
	></div>
{/if}

<!-- ── Sidebar ── -->
<aside
	class="fixed top-0 left-0 z-30 h-full w-64 flex flex-col
        glass border-r border-(--border)
        transform transition-transform duration-300 ease-in-out
        {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto"
>
	<!-- Logo -->
	<div class="flex items-center gap-3 px-6 py-5 border-b border-(--border) group/logo select-none">
		<div class="w-9 h-9 rounded-xl bg-(--accent) flex items-center justify-center shadow-(--shadow-glow) transition-transform duration-300 group-hover/logo:rotate-12 group-hover/logo:scale-105">
			<span class="text-(--accent-text) font-bold text-lg">F</span>
		</div>

        <div>
			<p class="font-bold text-(--text-primary) leading-tight transition-colors group-hover/logo:text-(--accent)">FamiPass</p>
			<p class="text-xs text-(--text-muted)">Admin Panel</p>
		</div>
	</div>

	<!-- Nav -->
	<nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
		{#each navItems as { href, label, Icon }}
			{@const isActive = currentPath.startsWith( href )}
			<a
				{href}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-300 group border-l-2 border-transparent
                    {isActive
                        ? 'bg-(--accent-muted) text-(--accent) border-l-(--accent) shadow-sm'
                        : 'text-(--text-secondary) hover:bg-(--bg-surface-2) hover:text-(--text-primary) hover:translate-x-1.5 hover:border-l-(--accent)'}"
				onclick={ () => { sidebarOpen = false; } }
			>
				<Icon
					size={18}
					class="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                        {isActive ? 'text-(--accent)' : 'text-(--text-muted)'}"
				/>

                {label}

                {#if isActive}
					<span class="ml-auto w-1.5 h-1.5 rounded-full bg-(--accent) animate-pulse"></span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- User & Logout -->
	<div class="px-4 py-4 border-t border-(--border)">
		<div class="flex items-center gap-3 mb-3 group/user">
			<div class="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center shrink-0 transition-transform duration-300 group-hover/user:scale-110 group-hover/user:rotate-6 shadow-sm">
				<span class="text-(--accent-text) text-xs font-bold">
					{ data?.user?.name?.charAt( 0 )?.toUpperCase() ?? 'A' }
				</span>
			</div>

            <div class="min-w-0">
				<p class="text-sm font-medium text-(--text-primary) truncate transition-colors group-hover/user:text-(--accent)">{data?.user?.name ?? 'Admin'}</p>

                <p class="text-xs text-(--text-muted) truncate">
                    {data?.user?.email ?? ''}
                </p>
			</div>
		</div>

        <div class="flex items-center gap-2">
            <button
                onclick={ handleLogout }
                class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                    text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10
                    transition-all duration-300 group/btn"
            >
                <LogOut size={16} class="transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
                Cerrar sesión
            </button>

            <ToggleTheme />
        </div>
	</div>
</aside>
