<script lang="ts">
	import { deserialize }      from '$app/forms';
	import { page }             from '$app/state';
	import { goto, invalidate } from '$app/navigation';

    import { UserPlus, Search } from '@lucide/svelte';

	import type { User as UserType }    from '$lib/types/index.js';
	import ViewSwitcher                 from '$lib/components/shared/ViewSwitcher.svelte';
	import Pagination                   from '$lib/components/shared/Pagination.svelte';
	import UserTable                    from './components/UserTable.svelte';
	import UserCard                     from './components/UserCard.svelte';
	import Button                       from '$lib/components/ui/Button.svelte';
	import Modal                        from '$lib/components/ui/Modal.svelte';
	import Select                       from '$lib/components/ui/Select.svelte';
    import { roleOptions }              from './utils/constants';


    interface Props {
		data: {
			users : UserType[];
			count : number;
		};
	}


    let { data }: Props = $props();


    let searchQuery     = $state( page.url.searchParams.get( 'search' ) || '' );
	let selectedRole    = $state( page.url.searchParams.get( 'role' ) || 'ALL' );
	let deleteError     = $state<string | null>( null );
	let isDeleting      = $state( false );
	let deleteModal     = $state<{
		open : boolean;
		id   : string | null;
		name : string;
	}>({
		open : false,
		id   : null,
		name : ''
	});


    const currentView = $derived( page.url.searchParams.get( 'view' ) || 'card' );


	$effect( () => {
		const urlRole = page.url.searchParams.get( 'role' ) || 'ALL';
		if ( selectedRole !== urlRole ) {
			handleFilterChange();
		}
	});


    function handleFilterChange(): void {
		const url = new URL( page.url );

		if ( searchQuery.trim() ) {
			url.searchParams.set( 'search', searchQuery.trim() );
		} else {
			url.searchParams.delete( 'search' );
		}

		if ( selectedRole && selectedRole !== 'ALL' ) {
			url.searchParams.set( 'role', selectedRole );
		} else {
			url.searchParams.delete( 'role' );
		}

		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		} );
	}


    function handleSearchInput( e: Event ): void {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		handleFilterChange();
	}


    function clearFilters(): void {
		searchQuery  = '';
		selectedRole = 'ALL';

		const url = new URL( page.url );

        url.searchParams.delete( 'search' );
		url.searchParams.delete( 'role' );
		url.searchParams.set( 'page', '1' );

		goto( url.pathname + url.search, {
			keepFocus    : true,
			replaceState : true
		});
	}


    function openDeleteModal( user: UserType ): void {
		deleteError = null;
		deleteModal = {
			open : true,
			id   : user.id,
			name : user.full_name
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
			} );

			const result = deserialize( await response.text() );

			if ( result.type === 'success' ) {
				await invalidate( 'app:users' );
				deleteModal = {
					open : false,
					id   : null,
					name : ''
				};
			} else if ( result.type === 'failure' ) {
				deleteError = ( result.data as any )?.error ?? 'Error al eliminar el usuario.';
			} else if ( result.type === 'error' ) {
				deleteError = result.error?.message ?? 'Error inesperado del servidor.';
			}
		} catch ( err: unknown ) {
			deleteError = ( err as Error ).message;
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Usuarios — FamiPass Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-extrabold bg-linear-to-r from-text-primary to-accent bg-clip-text text-transparent tracking-tight">
				Usuarios
			</h1>
			<p class="text-sm text-text-secondary mt-1">
				Administra y gestiona los roles y credenciales de los usuarios
			</p>
		</div>

		<div class="flex items-center gap-3">
			<ViewSwitcher />

			<a href="/users/form">
				<Button variant="primary">
					<UserPlus size={ 18 } />
					Nuevo Usuario
				</Button>
			</a>
		</div>
	</div>

	<!-- Filtros -->
	<div class="p-4 rounded-2xl bg-zinc-100/20 dark:bg-zinc-950/20 border border-border/80 flex flex-col md:flex-row gap-4 items-center justify-between">
		<div class="relative w-full md:max-w-md">
			<Search size={ 16 } class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
			<input
				type="text"
				placeholder="Buscar por nombre, rut o email..."
				value={ searchQuery }
				oninput={ handleSearchInput }
				class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-bg-surface-2 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all duration-300"
			/>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
			<div class="w-full sm:w-56">
				<Select
					options={ roleOptions }
					bind:value={ selectedRole }
					placeholder="Filtrar por rol"
				/>
			</div>

			{#if searchQuery || selectedRole !== 'ALL'}
				<Button
					variant="secondary"
					onclick={ clearFilters }
					class="w-full sm:w-auto border border-border hover:bg-zinc-100 dark:hover:bg-zinc-900"
				>
					Limpiar Filtros
				</Button>
			{/if}
		</div>
	</div>

	<!-- Listado/Tabla de Usuarios -->
	{#if currentView === 'table'}
		<UserTable users={ data.users } onDelete={ openDeleteModal } />
	{:else}
		<UserCard users={ data.users } onDelete={ openDeleteModal } />
	{/if}

	<!-- Paginación -->
	{#if data.count > 0}
		<Pagination count={ data.count } />
	{/if}
</div>

<!-- Modal de Eliminación -->
<Modal
	open={ deleteModal.open }
	onClose={ () => deleteModal.open = false }
	onConfirm={ confirmDelete }
	title="Eliminar Usuario"
	confirmLabel="Eliminar"
	confirmVariant="danger"
	loading={ isDeleting }
>
	<p>¿Estás seguro de que deseas eliminar al usuario <strong class="text-text-primary">"{ deleteModal.name }"</strong>?</p>
	<p class="mt-2 text-xs">Esta acción no se puede deshacer y podría impactar órdenes o membresías vinculadas.</p>
	{#if deleteError}
		<p class="mt-3 text-red-500 text-sm">{ deleteError }</p>
	{/if}
</Modal>
