<script lang="ts">
	import { page } from '$app/state';
	import { ChevronRight, Home, Calendar, Users, ShieldAlert, Package, ShoppingCart } from '@lucide/svelte';

	interface BreadcrumbItem {
		label  : string;
		href   : string;
		icon?  : any;
		isLast : boolean;
	}

	const routeMap: Record<string, { label: string; icon: any }> = {
		dashboard : { label: 'Dashboard', icon: Home },
		events    : { label: 'Eventos', icon: Calendar },
		families  : { label: 'Familias', icon: Users },
		users     : { label: 'Usuarios', icon: ShieldAlert },
		products  : { label: 'Productos', icon: Package },
		orders    : { label: 'Órdenes', icon: ShoppingCart },
		members   : { label: 'Miembros', icon: Users }
	};

	const breadcrumbs = $derived.by( () => {
		const list: BreadcrumbItem[] = [];
		const parts = page.url.pathname.split( '/' ).filter( Boolean );
		let currentHref = '';

		// Always start with Home / Dashboard
		list.push( {
			label  : 'Inicio',
			href   : '/dashboard',
			icon   : Home,
			isLast : parts.length === 0 || ( parts.length === 1 && parts[ 0 ] === 'dashboard' )
		} );

		for ( let i = 0; i < parts.length; i++ ) {
			const part = parts[ i ];
			if ( part === 'dashboard' ) continue;

			currentHref += `/${ part }`;

			let label = part;
			let icon = undefined;

			if ( routeMap[ part ] ) {
				label = routeMap[ part ].label;
				icon  = routeMap[ part ].icon;
			} else if ( part === 'form' ) {
				const isEdit = page.url.searchParams.has( 'id' );
				const parentPart = parts[ i - 1 ];
				if ( parentPart === 'events' ) {
					label = isEdit ? 'Editar Evento' : 'Nuevo Evento';
				} else if ( parentPart === 'users' ) {
					label = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
				} else if ( parentPart === 'families' ) {
					label = isEdit ? 'Editar Familia' : 'Nueva Familia';
				} else if ( parentPart === 'products' ) {
					label = isEdit ? 'Editar Producto' : 'Nuevo Producto';
				} else {
					label = isEdit ? 'Editar' : 'Nuevo';
				}
			} else {
				const isUuid = /^[0-9a-fA-F-]{36}$/.test( part );
				const isNumeric = /^\d+$/.test( part );
				if ( isUuid || isNumeric ) {
					if ( page.data.event && ( page.data.event.id === part || page.data.event.id ) ) {
						label = page.data.event.event_name || 'Detalle Evento';
					} else if ( page.data.family && ( page.data.family.id === part || page.data.family.id ) ) {
						label = page.data.family.family_name || 'Detalle Familia';
					} else if ( page.data.user && ( page.data.user.id === part || page.data.user.id ) ) {
						label = page.data.user.full_name || 'Detalle Usuario';
					} else if ( page.data.product && ( page.data.product.id === part || page.data.product.id ) ) {
						label = page.data.product.name || 'Detalle Producto';
					} else if ( page.data.familyEvent ) {
						label = page.data.familyEvent.family?.family_name || 'Detalle';
					} else {
						label = 'Detalle';
					}
				}
			}

			list.push( {
				label,
				href   : currentHref,
				icon,
				isLast : i === parts.length - 1
			} );
		}

		return list;
	} );
</script>

<nav class="flex items-center flex-wrap gap-1 text-sm text-text-secondary select-none" aria-label="Breadcrumb">
	{#each breadcrumbs as item, index}
		{#if index > 0}
			<ChevronRight size={ 14 } class="mx-1 text-text-muted/50 shrink-0" />
		{/if}

		<div class="flex items-center gap-1.5 transition-all duration-300">
			{#if item.isLast}
				<span class="flex items-center gap-1.5 font-bold text-text-primary text-xs sm:text-sm">
					{#if item.icon}
						{@const Icon = item.icon}
						<Icon size={ 14 } class="shrink-0 text-accent" />
					{/if}
					{ item.label }
				</span>
			{:else}
				<a
					href={ item.href }
					class="flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:text-accent transition-colors duration-200"
				>
					{#if item.icon}
						{@const Icon = item.icon}
						<Icon size={ 14 } class="shrink-0 text-text-muted/80" />
					{/if}
					{ item.label }
				</a>
			{/if}
		</div>
	{/each}
</nav>
