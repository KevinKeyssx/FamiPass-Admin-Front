<script lang="ts">
	import { page } from '$app/state';

    import {
        ChevronRight,
        House,
        Calendar,
        Users,
        ShieldAlert,
        Package,
        ShoppingCart,
        Pencil, 
        Plus
    } from '@lucide/svelte';


    interface BreadcrumbItem {
		label  : string;
		href   : string;
		icon?  : any;
		isLast : boolean;
	}


    const routeMap: Record<string, { label: string; icon: any }> = {
		dashboard : { label: 'Dashboard',   icon: House },
		events    : { label: 'Eventos',     icon: Calendar },
		families  : { label: 'Familias',    icon: Users },
		users     : { label: 'Usuarios',    icon: ShieldAlert },
		products  : { label: 'Productos',   icon: Package },
		orders    : { label: 'Órdenes',     icon: ShoppingCart },
		members   : { label: 'Miembros',    icon: Users }
	};


    const breadcrumbs = $derived.by( () => {
		const list: BreadcrumbItem[] = [];
		const parts = page.url.pathname.split( '/' ).filter( Boolean );

        let currentHref = '';

		// Always start with Home / Dashboard
		list.push({
			label  : 'Inicio',
			href   : '/dashboard',
			icon   : House,
			isLast : parts.length === 0 || ( parts.length === 1 && parts[ 0 ] === 'dashboard' )
		});

		for ( let i = 0; i < parts.length; i++ ) {
			const part = parts[ i ];

			if ( part === 'dashboard' ) continue;

			currentHref += `/${ part }`;

			let label = part;
			let icon  = undefined;

			if ( routeMap[ part ] ) {
				label = routeMap[ part ].label;
				icon  = routeMap[ part ].icon;
			} else if ( part === 'form' ) {
				const isEdit     = page.url.searchParams.has( 'id' );
				const parentPart = parts[ i - 1 ];

				label = {
					'users'    : isEdit ? 'Editar Usuario'  : 'Nuevo Usuario',
					'events'   : isEdit ? 'Editar Evento'   : 'Nuevo Evento',
					'families' : isEdit ? 'Editar Familia'  : 'Nueva Familia',
					'products' : isEdit ? 'Editar Producto' : 'Nuevo Producto'
				}[ parentPart ] || ( isEdit ? 'Editar' : 'Nuevo' );

				icon = isEdit ? Pencil : Plus;
			} else {
				const isUuid     = /^[0-9a-fA-F-]{36}$/.test( part );
				const isNumeric  = /^\d+$/.test( part );
				const parentPart = parts[ i - 1 ];

				if ( isUuid || isNumeric ) {
					if ( routeMap[ parentPart ] ) {
						icon = routeMap[ parentPart ].icon;
					}

					if ( page.data.event && ( page.data.event.id === part || page.data.event.id ) ) {
						label = page.data.event.event_name || 'Detalle Evento';
					} else if ( page.data.family && ( page.data.family.id === part || page.data.family.id ) ) {
						label = page.data.family.family_name || 'Detalle Familia';
					} else if ( page.data.user && ( page.data.user.id === part || page.data.user.id ) ) {
						label = page.data.user.user_name || page.data.user.email || 'Detalle Usuario';
					} else if ( page.data.product && ( page.data.product.id === part || page.data.product.id ) ) {
						label = page.data.product.name || 'Detalle Producto';
					} else if ( page.data.familyEvent ) {
						label = page.data.familyEvent.family?.family_name || 'Detalle';
					} else {
						label = 'Detalle';
					}
				}
			}

			list.push({
				label,
				href   : currentHref,
				icon,
				isLast : i === parts.length - 1
			});
		}

		return list;
	});
</script>

<nav class="flex items-center gap-0.5 sm:gap-1 text-sm text-(--text-secondary) select-none min-w-0 overflow-x-auto no-scrollbar py-0.5" aria-label="Breadcrumb">
	{#each breadcrumbs as item, index}
		{#if index > 0}
			<ChevronRight size={ 14 } class="mx-0.5 text-(--text-muted)/50 shrink-0" />
		{/if}

		<div class="flex items-center gap-1.5 transition-all duration-300 shrink-0">
			{#if item.isLast}
				<span
					class="flex items-center gap-1.5 font-bold text-(--text-primary) text-xs sm:text-sm p-1 sm:p-0"
					title={ item.label }
					aria-label={ item.label }
				>
					{#if item.icon}
						{@const Icon = item.icon}
						<Icon size={ 16 } class="shrink-0 text-(--accent)" />
						<span class="hidden sm:inline">{ item.label }</span>
					{:else}
						<span>{ item.label }</span>
					{/if}
				</span>
			{:else}
				<a
					href={ item.href }
					class="flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:text-(--accent) transition-colors duration-200 p-1 sm:p-0 rounded-md hover:bg-(--bg-surface-2)/60"
					title={ item.label }
					aria-label={ item.label }
				>
					{#if item.icon}
						{@const Icon = item.icon}
						<Icon size={ 16 } class="shrink-0 text-(--text-muted)/80" />
						<span class="hidden sm:inline">{ item.label }</span>
					{:else}
						<span>{ item.label }</span>
					{/if}
				</a>
			{/if}
		</div>
	{/each}
</nav>
