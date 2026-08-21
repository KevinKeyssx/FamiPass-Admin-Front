<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

    import { Plus, Search, Funnel } from '@lucide/svelte';

	import type { Product } from '$lib/types/index.js';
	import ViewSwitcher     from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination       from '$lib/components/shared/Pagination.svelte';
	import ProductTable     from './components/ProductTable.svelte';
	import ProductCard      from './components/ProductCard.svelte';
	import Button           from '$lib/components/ui/Button.svelte';
	import Modal            from '$lib/components/ui/Modal.svelte';


    interface Props {
		data: {
			products : Product[];
			count    : number;
		};
	}


    let { data } : Props = $props();


    const filterStatus  = $derived( ( page.url.searchParams.get( 'status' ) || 'ALL' ) as 'ALL' | 'ACTIVE' | 'INACTIVE' );
	const currentView   = $derived( page.url.searchParams.get( 'view' ) || 'card' );


	let searchQuery = $state( page.url.searchParams.get( 'search' ) || '' );
    let deleteError = $state<string | null>( null );
    let isDeleting  = $state( false );
    let deleteModal = $state<{
		open : boolean;
		id   : string | null;
		name : string;
	}>( {
		open : false,
		id   : null,
		name : ''
	} );


    const statusOptions: Array<{ value: 'ALL' | 'ACTIVE' | 'INACTIVE'; label: string }> = [
		{ value: 'ALL',      label: 'Todos' },
		{ value: 'ACTIVE',   label: 'Activos' },
		{ value: 'INACTIVE', label: 'Inactivos' }
	];


    function handleSearch(): void {
		const url = new URL( page.url );

        if ( searchQuery.trim() ) {
			url.searchParams.set( 'search', searchQuery.trim() );
		} else {
			url.searchParams.delete( 'search' );
		}

        url.searchParams.set( 'page', '1' );

        goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}


    function handleStatusFilter( newStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' ): void {
		const url = new URL( page.url );

        url.searchParams.set( 'status', newStatus );
		url.searchParams.set( 'page', '1' );

        goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}


    function openDeleteModal( product: Product ): void {
		deleteError = null;
		deleteModal = {
			open : true,
			id   : product.id,
			name : product.name
		};
	}


    async function confirmDelete(): Promise<void> {
		if ( !deleteModal.id ) return;

		isDeleting  = true;
		deleteError = null;

		const formData = new FormData();

        formData.append( 'id', deleteModal.id );

		try {
			const response = await fetch( '?/delete', {
				method : 'POST',
				body   : formData
			});

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:products' );

                deleteModal = {
					open : false,
					id   : null,
					name : ''
				};
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error || 'Error al eliminar producto';
			} else {
				deleteError = 'Ocurrió un error inesperado';
			}
		} catch ( err: any ) {
			deleteError = err.message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Productos — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="header-banner group">
		<div class="header-glow"></div>

		<div class="space-y-1 relative z-10">
			<h1 class="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent tracking-tight">
				Productos
			</h1>
			<p class="text-xs text-(--text-secondary) mt-0.5">
				Gestión del catálogo de productos de FamiPass
			</p>
		</div>

		<div class="flex items-center gap-3 relative z-10 shrink-0">
			<ViewSwitcher />

			<a href="/products/form">
				<Button variant="primary">
					<Plus size={ 16 } />
					Nuevo Producto
				</Button>
			</a>
		</div>
	</div>

	<!-- Controls / Filters & Search -->
	<div class="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
		<!-- Search input -->
		<div class="relative flex-1">
			<Search size={ 16 } class="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none" />

            <input
				type="text"
				bind:value={ searchQuery }
				placeholder="Buscar productos por nombre..."
				onkeydown={ ( e ) => e.key === 'Enter' && handleSearch() }
				class="w-full pl-10 pr-24 py-2.5 rounded-xl border border-(--border)/60 transition-all duration-300
					bg-(--bg-surface-2) text-(--text-primary) placeholder:text-(--text-muted) text-sm
					focus:outline-none focus:border-(--accent) focus:ring-4 focus:ring-(--accent)/10"
			/>

            <button
				onclick={ handleSearch }
				class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold
					bg-(--accent) text-(--accent-text) hover:bg-(--accent-hover) transition-colors cursor-pointer"
			>
				Buscar
			</button>
		</div>

		<!-- Status Filter buttons -->
		<div class="flex items-center gap-3 flex-wrap">
			<div class="flex items-center gap-1.5">
				<Funnel size={ 14 } class="text-(--text-secondary)" />
				<span class="text-xs text-(--text-secondary) font-semibold uppercase tracking-wider">Filtrar:</span>
			</div>

            <div class="inline-flex rounded-full border border-(--border)/60 p-0.5 bg-(--bg-surface-2)">
				{#each statusOptions as opt}
					<button
						onclick={() => { handleStatusFilter( opt.value ); }}
						class="px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer
							{ filterStatus === opt.value
								? 'bg-(--accent) text-(--accent-text) shadow-sm'
								: 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border)/30' }"
					>
						{ opt.label }
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Products List (Table or Card View) -->
	<div class="flex flex-col">
		{#if currentView === 'table' }
			<ProductTable products={ data.products } onDelete={ openDeleteModal } />
		{:else}
			<ProductCard products={ data.products } onDelete={ openDeleteModal } />
		{/if}

		<!-- Reusable Pagination Component -->
		<Pagination count={ data.count } />
	</div>
</div>

<!-- Delete modal -->
<Modal
	open={ deleteModal.open }
	title="Eliminar producto"
	onClose={() => { deleteModal = { open: false, id: null, name: '' }; deleteError = null; }}
	onConfirm={ confirmDelete }
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar el producto <strong class="text-(--text-primary)">"{ deleteModal.name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción eliminará de forma permanente el producto. No se puede deshacer.</p>
	{#if deleteError }
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
